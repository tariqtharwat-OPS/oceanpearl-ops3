import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\eg_di\.gemini\antigravity\brain\08a10f5f-362a-4c51-a7f7-20a75d197117\artifacts"
os.makedirs(output_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1400, "height": 900})
    page.goto(r"file:///D:/OPS3/01_SOURCE_CODE/docs/ui/OPS3_BLUEPRINT.html")
    time.sleep(1)

    print("Capturing Admin Dashboard...")
    page.evaluate("switchRoleContext('role_admin')")
    time.sleep(0.5)
    page.screenshot(path=os.path.join(output_dir, "admin_dashboard.png"), full_page=True)

    print("Capturing Boat Workflow...")
    page.evaluate("switchRoleContext('role_boat')")
    time.sleep(0.5)
    page.screenshot(path=os.path.join(output_dir, "boat_workflow.png"), full_page=True)

    print("Capturing A4 Layout...")
    page.evaluate("""
        switchRoleContext('role_boat');
        Array.from(document.querySelectorAll('.screen')).forEach(s => s.classList.remove('active'));
        document.getElementById('boat_close').classList.add('active');
        window.scrollTo(0, document.body.scrollHeight);
    """)
    time.sleep(0.5)
    page.screenshot(path=os.path.join(output_dir, "a4_document.png"))

    browser.close()
    print("Screenshots taken completely!")
