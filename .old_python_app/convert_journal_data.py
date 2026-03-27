#!/usr/bin/env python3
"""
Script to convert Journal Impact Factor 2024 Excel data to JSON format.
"""

import pandas as pd
import json
import re

def clean_journal_name(name):
    """Clean and format journal name for better readability."""
    # Convert to title case and clean up
    cleaned = name.title()
    # Handle special cases
    cleaned = cleaned.replace('Ca-', 'CA-')
    cleaned = cleaned.replace('Nature Reviews', 'Nature Reviews')
    return cleaned

def extract_category_from_name(name):
    """Extract category from journal name based on common patterns."""
    name_lower = name.lower()
    
    # Define category patterns
    categories = {
        'Oncology': ['cancer', 'oncology', 'tumor', 'carcinoma', 'leukemia', 'lymphoma'],
        'Microbiology': ['microbiology', 'microbial', 'bacteriology', 'virology'],
        'Pharmacology': ['pharmacology', 'drug', 'pharmaceutical', 'therapeutic'],
        'Molecular Biology': ['molecular', 'cell biology', 'genetics', 'genomics'],
        'Nephrology': ['kidney', 'nephrology', 'renal'],
        'General Medicine': ['lancet', 'medicine', 'clinical', 'medical'],
        'Cardiology': ['cardiology', 'cardiac', 'heart', 'cardiovascular'],
        'Neurology': ['neurology', 'neural', 'brain', 'neuroscience'],
        'Immunology': ['immunology', 'immune', 'allergy'],
        'Endocrinology': ['endocrinology', 'diabetes', 'hormone', 'metabolic'],
        'Gastroenterology': ['gastroenterology', 'gastrointestinal', 'hepatology', 'liver'],
        'Dermatology': ['dermatology', 'skin', 'cutaneous'],
        'Radiology': ['radiology', 'imaging', 'radiological'],
        'Surgery': ['surgery', 'surgical'],
        'Pediatrics': ['pediatrics', 'pediatric', 'child'],
        'Psychiatry': ['psychiatry', 'psychiatric', 'mental health'],
        'Obstetrics': ['obstetrics', 'gynecology', 'maternal'],
        'Ophthalmology': ['ophthalmology', 'eye', 'visual'],
        'Orthopedics': ['orthopedics', 'orthopaedic', 'bone', 'joint'],
        'Urology': ['urology', 'urological', 'urinary'],
        'Anesthesiology': ['anesthesiology', 'anesthesia'],
        'Pathology': ['pathology', 'pathological'],
        'Public Health': ['public health', 'epidemiology', 'health policy'],
        'Biochemistry': ['biochemistry', 'biochemical'],
        'Biotechnology': ['biotechnology', 'bioengineering'],
        'Environmental': ['environmental', 'ecology', 'environment'],
        'Chemistry': ['chemistry', 'chemical'],
        'Physics': ['physics', 'physical'],
        'Mathematics': ['mathematics', 'mathematical', 'statistics'],
        'Computer Science': ['computer', 'computing', 'informatics', 'software'],
        'Engineering': ['engineering', 'engineering'],
        'Materials Science': ['materials', 'material science'],
        'Earth Sciences': ['geology', 'geological', 'earth science', 'geography'],
        'Agriculture': ['agriculture', 'agricultural', 'crop', 'plant'],
        'Veterinary': ['veterinary', 'animal'],
        'Dentistry': ['dentistry', 'dental', 'oral'],
        'Nursing': ['nursing', 'nurse'],
        'Rehabilitation': ['rehabilitation', 'physical therapy', 'occupational therapy']
    }
    
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in name_lower:
                return category
    
    # Default category if no match found
    return 'General Science'

def convert_excel_to_json(excel_file, output_file):
    """Convert Excel file to JSON format."""
    print(f"Reading Excel file: {excel_file}")
    df = pd.read_excel(excel_file)
    
    print(f"Found {len(df)} journals")
    print("Columns:", df.columns.tolist())
    
    # Convert to JSON format
    journals = []
    
    for index, row in df.iterrows():
        journal_name = clean_journal_name(row['Journal Name'])
        abbreviated_name = row['Abbreviated Journal']
        jif_value = row['JIF 2024']
        quartile = row['JIF Quartile']
        
        # Extract category
        category = extract_category_from_name(journal_name)
        
        # Create aliases list (abbreviated name as alias)
        aliases = [abbreviated_name] if pd.notna(abbreviated_name) else []
        
        # Handle JIF value conversion
        if pd.isna(jif_value):
            jif_float = 0.0
        elif isinstance(jif_value, str):
            # Handle cases like "<0.1"
            if jif_value.startswith('<'):
                jif_float = 0.0
            else:
                try:
                    jif_float = float(jif_value)
                except ValueError:
                    jif_float = 0.0
        else:
            jif_float = float(jif_value)
        
        journal_entry = {
            "name": journal_name,
            "aliases": aliases,
            "category": category,
            "quartile": quartile,
            "jif": jif_float
        }
        
        journals.append(journal_entry)
    
    # Sort by JIF in descending order
    journals.sort(key=lambda x: x['jif'], reverse=True)
    
    # Write to JSON file
    print(f"Writing {len(journals)} journals to {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(journals, f, indent=2, ensure_ascii=False)
    
    print(f"Conversion completed! Output saved to {output_file}")
    
    # Print first few entries as preview
    print("\nFirst 10 journals:")
    for i, journal in enumerate(journals[:10]):
        print(f"{i+1}. {journal['name']} - {journal['category']} - Q{journal['quartile']} - JIF: {journal['jif']}")

if __name__ == "__main__":
    excel_file = "Journal Impact Factor 2024.xlsx"
    output_file = "journal_impact_factors.json"
    
    try:
        convert_excel_to_json(excel_file, output_file)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
