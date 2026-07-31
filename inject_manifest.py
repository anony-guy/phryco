import os
import glob

# Collect all HTML files in the frontend directory
html_files = []
for root, dirs, files in os.walk('g:/phryco/frontend'):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

manifest_tag = '    <link rel="manifest" href="/manifest.json">\n    <meta name="theme-color" content="#0f172a">\n'

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'manifest.json' not in content:
        # Find the end of <head> or right after <head>
        head_end = content.find('<head>')
        if head_end != -1:
            insertion_point = head_end + len('<head>\n')
            new_content = content[:insertion_point] + manifest_tag + content[insertion_point:]
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")
