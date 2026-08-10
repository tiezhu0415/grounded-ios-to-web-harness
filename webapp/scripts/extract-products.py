import re
import json
from pathlib import Path

base = Path('/Users/shijin/iOS-WebApp-Harness-MVP/xcode/eCommerce-main/eCommerce/Models/Product Info')
src = Path('/Users/shijin/iOS-WebApp-Harness-MVP/xcode/eCommerce-main/eCommerce/Utilities/ProductData/Database/ProductDatabase.swift')
text = src.read_text()

def parse_enum(path):
    data = {}
    content = path.read_text()
    # case name = "Value"
    for m in re.finditer(r'case\s+(\w+)\s*=\s*"([^"]+)"', content):
        data[m.group(1)] = m.group(2)
    return data

brand_map = parse_enum(base / 'Brand.swift')
gender_map = parse_enum(base / 'Gender.swift')
category_map = parse_enum(base / 'Category.swift')
subcategory_map = parse_enum(base / 'Category.swift')

size_map = {
    'topsSizes': ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
    'bottomsSizes': ["2", "4", "6", "8", "10", "12", "14"],
    'shoesSizes': ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"],
    'beltsSizes': ["26", "28", "30", "32", "34", "36", "38"],
    'accessoriesSizes': ["One Size"],
}

def resolve_sizes(s):
    s = s.strip()
    if s in size_map:
        return size_map[s]
    m = re.match(r'\[(.*)\]', s, re.DOTALL)
    if m:
        items = [x.strip().strip('"') for x in m.group(1).split(',') if x.strip()]
        return items
    return []

product_pattern = re.compile(
    r'Product\(\s*id:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"\s*,\s*price:\s*(\d+)\s*,\s*brand:\s*Brand\.([^.]+)\.rawValue\s*,\s*gender:\s*Gender\.([^.]+)\.rawValue\s*,\s*category:\s*MasterCategory\.([^.]+)\.rawValue\s*,\s*subCategory:\s*SubCategory\.([^.]+)\.rawValue\s*,\s*description:\s*"""\n?(.*?)\n?"""\s*,\s*sizes:\s*([^,]+)\s*,\s*variants:\s*\[(.*?)\]\s*\)',
    re.DOTALL
)

variant_pattern = re.compile(
    r'ProductVariant\(\s*color:\s*(Color\.[a-zA-Z]+|Color\.init\(hex:\s*"([^"]+)"\))\s*,\s*colorName:\s*"([^"]+)"\s*,\s*imageUrl:\s*"([^"]+)"\s*\)'
)

products = []
for m in product_pattern.finditer(text):
    pid, name, price, brand_key, gender_key, category_key, subcategory_key, description, sizes_ref, variants_block = m.groups()
    description = description.strip()
    sizes = resolve_sizes(sizes_ref)
    variants = []
    for vm in variant_pattern.finditer(variants_block):
        _, hex_code, color_name, image_url = vm.groups()
        variants.append({
            'colorName': color_name,
            'imageUrl': image_url,
            'hex': hex_code or None
        })
    products.append({
        'id': pid,
        'name': name,
        'price': int(price),
        'brand': brand_map.get(brand_key, brand_key),
        'gender': gender_map.get(gender_key, gender_key),
        'category': category_map.get(category_key, category_key),
        'subCategory': subcategory_map.get(subcategory_key, subcategory_key),
        'description': description,
        'sizes': sizes,
        'variants': variants,
    })

print(f'Extracted {len(products)} products')

out = Path('/Users/shijin/iOS-WebApp-Harness-MVP/webapp/src/data/products.ts')
out.parent.mkdir(parents=True, exist_ok=True)

ts = f'''// Auto-generated from xcode/eCommerce-main/eCommerce/Utilities/ProductData/Database/ProductDatabase.swift
// Do not edit manually; re-run scripts/extract-products.py

export interface ProductVariant {{
  colorName: string;
  imageUrl: string;
  hex?: string | null;
}}

export interface Product {{
  id: string;
  name: string;
  price: number;
  brand: string;
  gender: string;
  category: string;
  subCategory: string;
  description: string;
  sizes: string[];
  variants: ProductVariant[];
}}

export const products: Product[] = {json.dumps(products, indent=2, ensure_ascii=False)};
'''

out.write_text(ts)
print(f'Wrote {out}')

# Extract discounts
discount_src = Path('/Users/shijin/iOS-WebApp-Harness-MVP/xcode/eCommerce-main/eCommerce/Utilities/ProductData/Database/DiscountDatabase.swift')
discount_text = discount_src.read_text()
discounts = []
for m in re.finditer(r'Discount\(\s*id:\s*"([^"]+)"\s*,\s*discountPercent:\s*(\d+)\s*\)', discount_text):
    discounts.append({'id': m.group(1), 'discountPercent': int(m.group(2))})

discount_out = Path('/Users/shijin/iOS-WebApp-Harness-MVP/webapp/src/data/discounts.ts')
discount_out.write_text(f'''// Auto-generated from DiscountDatabase.swift

export interface Discount {{
  id: string;
  discountPercent: number;
}}

export const discounts: Discount[] = {json.dumps(discounts, indent=2, ensure_ascii=False)};
''')
print(f'Wrote {discount_out} ({len(discounts)} discounts)')

# Extract new ins
newin_src = Path('/Users/shijin/iOS-WebApp-Harness-MVP/xcode/eCommerce-main/eCommerce/Utilities/ProductData/Database/NewInDatabase.swift')
newin_text = newin_src.read_text()
newins = []
for m in re.finditer(r'NewIn\(\s*id:\s*"([^"]+)"\s*\)', newin_text):
    newins.append(m.group(1))

newin_out = Path('/Users/shijin/iOS-WebApp-Harness-MVP/webapp/src/data/newins.ts')
newin_out.write_text(f'''// Auto-generated from NewInDatabase.swift

export const newInProductIds: string[] = {json.dumps(newins, indent=2, ensure_ascii=False)};
''')
print(f'Wrote {newin_out} ({len(newins)} new-ins)')
