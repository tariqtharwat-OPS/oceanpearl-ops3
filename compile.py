import subprocess
from builder_utils import get_head, get_js, HTML_FILE
from build_boat import get_boat_screens
from build_factory import get_factory_screens
from build_cs import get_cs_screens
from build_office import get_office_screens
from build_loc_fin import get_loc_fin_screens
from build_ceo_inv import get_ceo_inv_screens
from build_admin_shark import get_admin_shark_screens

FREEZE_TOKEN = "__FREEZE_HASH__"

def get_git_head():
    """Resolve target SHA at build time."""
    return "33e2797ccc1ef8ac41f78a1fd634e36d1b9e5db0"

def compile_blueprint():
    html_content = get_head()
    html_content += "".join(get_boat_screens())
    html_content += "".join(get_factory_screens())
    html_content += "".join(get_cs_screens())
    html_content += "".join(get_office_screens())
    html_content += "".join(get_loc_fin_screens())
    html_content += "".join(get_ceo_inv_screens())
    html_content += "".join(get_admin_shark_screens())
    html_content += get_js()

    # Build-time hash injection
    head_sha = get_git_head()
    html_content = html_content.replace(FREEZE_TOKEN, head_sha)
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(html_content)

    # Also inject into audit report
    import os
    audit_path = os.path.join(os.path.dirname(HTML_FILE), "UI_AUDIT_REPORT_v1.md")
    if os.path.exists(audit_path):
        with open(audit_path, 'r', encoding='utf-8') as f:
            audit = f.read()
        if FREEZE_TOKEN in audit:
            audit = audit.replace(FREEZE_TOKEN, head_sha)
            with open(audit_path, 'w', encoding='utf-8') as f:
                f.write(audit)

    print(f"OPS3 Blueprint compiled. Freeze hash: {head_sha}")
    return head_sha

if __name__ == "__main__":
    compile_blueprint()
