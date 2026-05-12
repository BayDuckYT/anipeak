
import re

def check_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find JSX tags (very basic)
    # This won't handle everything but should give a hint
    tags = re.findall(r'<(/?[a-zA-Z0-9.]+)', content)
    
    stack = []
    for tag in tags:
        if tag.startswith('/'):
            opening = tag[1:]
            if not stack:
                print(f"Error: Unexpected closing tag </{opening}>")
                continue
            last = stack.pop()
            if last != opening:
                print(f"Error: Tag mismatch. Expected </{last}> but found </{opening}>")
        else:
            # Ignore self-closing tags
            if tag.endswith('/'):
                continue
            stack.append(tag)
    
    if stack:
        print(f"Error: Unclosed tags: {stack}")
    else:
        print("Tags balanced (roughly)")

check_tags(r'C:\Users\Murathan\Desktop\animain2\src\pages\ProfileShowcase.jsx')
