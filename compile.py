from builder_utils import get_head, get_js, HTML_FILE
from build_boat import get_boat_screens
from build_factory import get_factory_screens
from build_cs import get_cs_screens
from build_office import get_office_screens
from build_loc_fin import get_loc_fin_screens
from build_ceo_inv import get_ceo_inv_screens
from build_admin_shark import get_admin_shark_screens

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

    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("OPS3 Master Blueprint Generated Successfully (Split Method).")

if __name__ == "__main__":
    compile_blueprint()
