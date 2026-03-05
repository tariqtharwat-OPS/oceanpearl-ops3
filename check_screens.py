import re, glob

nav_ids = set()
with open('builder_utils.py', 'r') as f:
    for m in re.finditer(r"\{ id:\s*'([a-zA-Z0-9_]+)'", f.read()):
        nav_ids.add(m.group(1))

screen_ids = set()
for fn in glob.glob('build_*.py') + ['builder_utils.py']:
    with open(fn, 'r') as f:
        for m in re.finditer(r'screen\("([a-zA-Z0-9_]+)"', f.read()):
            screen_ids.add(m.group(1))

sys_screens = {'freeze_chk', 'screen_welcome', 'screen_noconfig', 'screen_missing_block'}
screen_ids.update(sys_screens)

missing = nav_ids - screen_ids
print("Missing screens:", missing)
