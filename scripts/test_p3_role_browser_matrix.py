"""
OPS3 Phase 3.1 — Role-Based Browser Test Matrix
Tests all 4 roles across all 12 implemented screens.
"""
import asyncio
import json
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout

BASE_URL = "http://localhost:5174"

results = []

def record(role, screen, check, status, issue="", severity="", fix=""):
    results.append({
        "role": role, "screen": screen, "check": check,
        "status": status, "issue": issue, "severity": severity, "fix": fix,
    })
    icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️" if status == "WARN" else "⏭️"
    msg = f"  {icon} [{role}] {screen} — {check}: {status}"
    if issue:
        msg += f" | {issue}"
    print(msg)


async def login(page, email, password, role):
    """Login and wait for the RoleBasedRouter to redirect to the role-specific route."""
    try:
        await page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=15000)
        await page.wait_for_selector("input[type='email']", timeout=8000)
        record(role, "LoginPage", "Page Load", "PASS")
    except Exception as e:
        record(role, "LoginPage", "Page Load", "FAIL", str(e)[:80], "CRITICAL", "Check vite dev server")
        return False

    await page.locator("input[type='email']").first.fill(email)
    await page.locator("input[type='password']").first.fill(password)
    await page.locator("button[type='submit']").click()

    try:
        # Wait for redirect away from login
        await page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
        # Wait for RoleBasedRouter to process and redirect to role-specific route
        await page.wait_for_timeout(2500)
        record(role, "LoginPage", "Login + Redirect", "PASS")
        return True
    except PlaywrightTimeout:
        body = await page.locator("body").text_content()
        record(role, "LoginPage", "Login + Redirect", "FAIL",
               f"Did not redirect. Body: {(body or '')[:100]}", "CRITICAL",
               "Check auth emulator and user profile seeding")
        return False


async def check_screen(page, role, name, path, expected_texts=None, allowed=True):
    """Navigate to a screen and verify it loads without crashing."""
    try:
        await page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=12000)
        await page.wait_for_timeout(2500)  # Wait for React + Firestore auth state
        url = page.url

        if not allowed:
            if path in url:
                record(role, name, "Access Control", "FAIL",
                       "Unauthorized role can access this screen", "HIGH",
                       "Add role guard to ProtectedRoute allowedRoles")
            else:
                record(role, name, "Access Control (blocked)", "PASS")
            return "blocked"

        if "/login" in url:
            record(role, name, "Page Access", "FAIL",
                   "Redirected to login — ProtectedRoute denied access", "HIGH",
                   f"Add '{role}' to allowedRoles in App.tsx")
            return "denied"

        body = await page.locator("body").text_content() or ""
        if len(body.strip()) < 20:
            record(role, name, "Page Load", "FAIL",
                   "Page rendered empty — possible React crash", "HIGH",
                   "Check component imports and default exports")
            return "crash"

        if "Something went wrong" in body or "Unexpected Application Error" in body:
            record(role, name, "Page Load", "FAIL",
                   "React error boundary triggered", "HIGH", "Check component for runtime errors")
            return "error"

        record(role, name, "Page Load", "PASS")

        if expected_texts:
            found = any(t.lower() in body.lower() for t in expected_texts)
            if found:
                record(role, name, "Content Check", "PASS")
            else:
                record(role, name, "Content Check", "WARN",
                       f"Expected text not found: {expected_texts}", "LOW",
                       "Verify page heading/content renders correctly")

        return "ok"

    except PlaywrightTimeout:
        record(role, name, "Page Load", "FAIL", "Page timed out (domcontentloaded)", "MEDIUM",
               "Check for infinite loading states")
        return "timeout"


async def check_form_validation(page, role, name, path):
    """Check that forms show validation on empty submit."""
    try:
        await page.goto(f"{BASE_URL}{path}", wait_until="domcontentloaded", timeout=12000)
        await page.wait_for_timeout(2000)
        if "/login" in page.url:
            record(role, name, "Form Validation", "SKIP", "Not accessible to this role")
            return

        submit = page.locator(
            "button[type='submit'], button:has-text('Create'), button:has-text('Confirm'), "
            "button:has-text('Submit'), button:has-text('Save'), button:has-text('Post'), "
            "button:has-text('Start'), button:has-text('Advance'), button:has-text('Complete')"
        )
        if await submit.count() == 0:
            record(role, name, "Form Validation", "WARN", "No submit button found", "LOW",
                   "Verify form has a submit button")
            return

        await submit.first.click()
        await page.wait_for_timeout(600)

        body = await page.locator("body").text_content() or ""
        invalid_count = await page.locator("input:invalid, select:invalid").count()
        error_count = await page.locator(
            "[class*='error'], [class*='Error'], .text-red-500, .text-red-600, .text-red-700"
        ).count()

        has_validation = (
            invalid_count > 0 or error_count > 0
            or any(kw in body.lower() for kw in ["required", "cannot be empty", "is required",
                                                   "please enter", "must be", "invalid"])
        )

        if has_validation:
            record(role, name, "Form Validation", "PASS")
        else:
            record(role, name, "Form Validation", "WARN",
                   "No visible validation on empty submit", "LOW",
                   "Add required field validation with visible error messages")

    except Exception as e:
        record(role, name, "Form Validation", "FAIL", str(e)[:80], "MEDIUM", "Investigate")


async def check_cancel_button(page, role, name):
    """Check that action screens have a Cancel/Back button."""
    cancel = page.locator(
        "button:has-text('Cancel'), button:has-text('Back'), "
        "a:has-text('Back'), a:has-text('Cancel'), "
        "button:has-text('← Back'), a:has-text('← Back')"
    )
    if await cancel.count() > 0:
        record(role, name, "Cancel/Back Button", "PASS")
    else:
        record(role, name, "Cancel/Back Button", "WARN",
               "No Cancel/Back button on action screen", "LOW",
               "Add Cancel/Back button for better UX")


async def check_nav_visibility(page, role, expected_keywords, forbidden_keywords):
    """Check sidebar navigation shows correct items for the role."""
    nav = await page.locator("nav a, aside a, [class*='sidebar'] a, [class*='nav'] a").all_text_contents()
    nav_text = " ".join(nav).lower()

    for kw in expected_keywords:
        if kw.lower() in nav_text:
            record(role, "Sidebar", f"Nav: '{kw}'", "PASS")
        else:
            record(role, "Sidebar", f"Nav: '{kw}'", "WARN",
                   f"Expected nav item not found in sidebar", "LOW",
                   "Check layout NavItem list")

    for kw in forbidden_keywords:
        if kw.lower() in nav_text:
            record(role, "Sidebar", f"Nav: '{kw}' (should be hidden)", "FAIL",
                   f"Forbidden nav item visible to this role", "HIGH",
                   "Remove from sidebar or add role guard")
        else:
            record(role, "Sidebar", f"Nav: '{kw}' (correctly hidden)", "PASS")


async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])

        # ─── HUB OPERATOR ────────────────────────────────────────────────────
        print("\n" + "="*60)
        print("ROLE: hub_operator")
        print("="*60)
        page = await browser.new_page()
        ok = await login(page, "hub.operator@ops3.test", "Test1234!", "hub_operator")

        if ok:
            record("hub_operator", "RoleRouter", "Route Redirect",
                   "PASS" if "/app/hub/" in page.url else "FAIL",
                   "" if "/app/hub/" in page.url else f"Got {page.url}", "HIGH",
                   "Check RoleBasedRouter hub_operator case")

            await check_nav_visibility(page, "hub_operator",
                expected_keywords=["trip", "receiving", "variance"],
                forbidden_keywords=["batch", "wip", "transformation"]
            )

            hub_screens = [
                ("/app/hub/trips",    "HubTripList",         ["Closed Trips", "Trips available"]),
                ("/app/hub/create",   "HubReceivingCreate",  ["Create", "Receiving", "Trip"]),
                ("/app/hub/inspect",  "HubReceivingInspect", ["Inspect", "Receiving"]),
                ("/app/hub/confirm",  "HubReceivingConfirm", ["Confirm", "Receiving"]),
                ("/app/hub/variance", "HubVarianceReport",   ["Variance", "Receiving"]),
            ]
            for path, name, texts in hub_screens:
                result = await check_screen(page, "hub_operator", name, path, texts)
                if result == "ok":
                    await check_cancel_button(page, "hub_operator", name)
                    await check_form_validation(page, "hub_operator", name, path)

            # Access control: hub_operator blocked from factory
            for path, name in [
                ("/app/factory/batches",      "FactoryBatchList"),
                ("/app/factory/batch-create", "FactoryBatchCreate"),
            ]:
                await check_screen(page, "hub_operator", name, path, allowed=False)

        await page.goto(f"{BASE_URL}/login")
        await page.close()

        # ─── FACTORY OPERATOR ────────────────────────────────────────────────
        print("\n" + "="*60)
        print("ROLE: factory_operator")
        print("="*60)
        page = await browser.new_page()
        ok = await login(page, "factory.operator@ops3.test", "Test1234!", "factory_operator")

        if ok:
            record("factory_operator", "RoleRouter", "Route Redirect",
                   "PASS" if "/app/factory/" in page.url else "FAIL",
                   "" if "/app/factory/" in page.url else f"Got {page.url}", "HIGH",
                   "Check RoleBasedRouter factory_operator case")

            await check_nav_visibility(page, "factory_operator",
                expected_keywords=["batch", "wip", "transformation", "yield"],
                forbidden_keywords=["variance report", "hub trip"]
            )

            factory_screens = [
                ("/app/factory/batches",        "FactoryBatchList",      ["Processing Batches", "Active"]),
                ("/app/factory/batch-create",   "FactoryBatchCreate",    ["Create", "Batch"]),
                ("/app/factory/wip-create",     "FactoryWipCreate",      ["WIP", "Batch"]),
                ("/app/factory/wip-advance",    "FactoryWipAdvance",     ["Advance", "WIP"]),
                ("/app/factory/wip-complete",   "FactoryWipComplete",    ["Complete", "WIP"]),
                ("/app/factory/transformation", "FactoryTransformation", ["Transformation", "Document"]),
                ("/app/factory/yield",          "FactoryYieldSummary",   ["Yield", "Batch"]),
            ]
            for path, name, texts in factory_screens:
                result = await check_screen(page, "factory_operator", name, path, texts)
                if result == "ok":
                    await check_cancel_button(page, "factory_operator", name)
                    await check_form_validation(page, "factory_operator", name, path)

            # Access control: factory_operator blocked from hub
            for path, name in [
                ("/app/hub/trips",  "HubTripList"),
                ("/app/hub/create", "HubReceivingCreate"),
            ]:
                await check_screen(page, "factory_operator", name, path, allowed=False)

        await page.goto(f"{BASE_URL}/login")
        await page.close()

        # ─── ADMIN ───────────────────────────────────────────────────────────
        print("\n" + "="*60)
        print("ROLE: admin")
        print("="*60)
        page = await browser.new_page()
        ok = await login(page, "admin@ops3.test", "Test1234!", "admin")

        if ok:
            record("admin", "RoleRouter", "Route Redirect",
                   "PASS" if "/app/admin/" in page.url else "FAIL",
                   "" if "/app/admin/" in page.url else f"Got {page.url}", "HIGH",
                   "Check RoleBasedRouter admin case")

            # Admin can access factory and hub (allowedRoles includes 'admin')
            for path, name, texts in [
                ("/app/factory/batches",        "FactoryBatchList",    ["Processing Batches"]),
                ("/app/factory/batch-create",   "FactoryBatchCreate",  ["Create", "Batch"]),
                ("/app/hub/trips",              "HubTripList",         ["Closed Trips"]),
                ("/app/hub/create",             "HubReceivingCreate",  ["Create", "Receiving"]),
            ]:
                await check_screen(page, "admin", name, path, texts, allowed=True)

        await page.goto(f"{BASE_URL}/login")
        await page.close()

        # ─── CEO ─────────────────────────────────────────────────────────────
        print("\n" + "="*60)
        print("ROLE: ceo")
        print("="*60)
        page = await browser.new_page()
        ok = await login(page, "ceo@ops3.test", "Test1234!", "ceo")

        if ok:
            record("ceo", "RoleRouter", "Route Redirect",
                   "PASS" if "/app/ceo/" in page.url else "FAIL",
                   "" if "/app/ceo/" in page.url else f"Got {page.url}", "HIGH",
                   "Check RoleBasedRouter ceo case")

            # CEO can access factory and hub (allowedRoles includes 'ceo')
            for path, name, texts in [
                ("/app/factory/batches",        "FactoryBatchList",    ["Processing Batches"]),
                ("/app/factory/batch-create",   "FactoryBatchCreate",  ["Create", "Batch"]),
                ("/app/hub/trips",              "HubTripList",         ["Closed Trips"]),
                ("/app/hub/create",             "HubReceivingCreate",  ["Create", "Receiving"]),
            ]:
                await check_screen(page, "ceo", name, path, texts, allowed=True)

        await page.goto(f"{BASE_URL}/login")
        await page.close()

        await browser.close()

    # ─── SUMMARY ─────────────────────────────────────────────────────────────
    total  = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    warned = sum(1 for r in results if r["status"] == "WARN")
    skipped = sum(1 for r in results if r["status"] == "SKIP")

    print(f"\n{'='*60}")
    print(f"ROLE BROWSER TEST MATRIX — FINAL SUMMARY")
    print(f"{'='*60}")
    print(f"Total : {total}  |  PASS: {passed}  |  FAIL: {failed}  |  WARN: {warned}  |  SKIP: {skipped}")
    print(f"{'='*60}")

    if failed > 0:
        print("\nFAILURES:")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  [{r['role']}] {r['screen']} — {r['check']}: {r['issue']}")

    with open("/tmp/browser_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to /tmp/browser_test_results.json")
    return results


asyncio.run(run())
