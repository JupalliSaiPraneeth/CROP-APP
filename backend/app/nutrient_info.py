from typing import Dict, Any, List

CROP_NAMES_MAP = {
    "ash_gourd": "Ash Gourd (Benincasa hispida)",
    "bitter_gourd": "Bitter Gourd (Momordica charantia)",
    "bottle_gourd": "Bottle Gourd (Lagenaria siceraria)",
    "cucumber": "Cucumber (Cucumis sativus)",
    "eggplant": "Eggplant / Brinjal (Solanum melongena)",
    "ridge_gourd": "Ridge Gourd (Luffa acutangula)",
    "snake_gourd": "Snake Gourd (Trichosanthes cucumerina)",
    "tomato": "Tomato (Solanum lycopersicum)"
}

DEFICIENCY_DETAILS: Dict[str, Dict[str, Any]] = {
    "N": {
        "title": "Nitrogen (N) Macronutrient Deficiency",
        "nutrient_element": "Nitrogen (N)",
        "nutrients": ["Nitrogen (N) Macronutrient"],
        "is_healthy": False,
        "severity": "High",
        "agronomic_clarification": "Nitrogen (N) is a primary macronutrient essential for chlorophyll and amino acid synthesis.",
        "primary_symptom": "General uniform chlorosis (pale yellowing) starting on older basal leaves, stunted vine/stem extension, small pale foliage, and premature leaf drop.",
        "physiological_role": "Nitrogen is a core constituent of amino acids, proteins, and chlorophyll. Deficiency severely impairs photosynthetic assimilation and vegetative canopy development.",
        "chemical_remedies": [
            "Foliar spray with 1.0% to 1.5% agricultural-grade Urea (10-15g per liter of water) during early morning or late evening.",
            "Apply side-dressing of Calcium Ammonium Nitrate (CAN) or Ammonium Sulfate around the root drip line at 20-25 kg/ha.",
            "For fertigation systems, inject water-soluble 19-19-19 or 20-10-10 at 3-5 kg/ha weekly until vigorous greening returns."
        ],
        "organic_remedies": [
            "Apply well-rotted farmyard manure (FYM) or enriched vermicompost (2-3 tonnes/acre) incorporated into topsoil.",
            "Apply fermented cow urine (diluted 1:10 with water) or Jeevamrutha as a root drench every 10-14 days.",
            "Top-dress with neem cake or blood meal to provide slow-release organic nitrogen."
        ],
        "prevention": [
            "Perform soil organic carbon tests prior to sowing; maintain soil organic matter > 0.8%.",
            "Avoid over-watering or waterlogging that triggers nitrate leaching and denitrification in root zones.",
            "Incorporate green manure leguminous cover crops (such as Sesbania or Sunn hemp) into crop rotation."
        ]
    },
    "K": {
        "title": "Potassium (K) Macronutrient Deficiency",
        "nutrient_element": "Potassium (K)",
        "nutrients": ["Potassium (K) Macronutrient (from N-P-K fertilizer)"],
        "is_healthy": False,
        "severity": "High",
        "agronomic_clarification": "Potassium (symbol 'K' from Latin Kalium) is an essential agricultural macronutrient from NPK fertilizers. Note: In plants, 'K' designates elemental Potassium, not human Vitamin K. Plants do not experience Vitamin K deficiency.",
        "primary_symptom": "Marginal chlorosis turning into necrotic scorching/burning along leaf margins and tips ('tip burn'), upward or downward curling of leaf edges, and reduced fruit firmness.",
        "physiological_role": "Potassium regulates stomatal aperture, water-use efficiency, enzyme activation, and translocates photosynthates into developing fruits. It is the 'K' in standard agricultural N-P-K fertilizers.",
        "chemical_remedies": [
            "Foliar spray with 0.5% to 1.0% Potassium Nitrate (KNO3) or Sulphate of Potash (SOP, 0-0-50) at 5-10g per liter.",
            "Apply Muriate of Potash (MOP / KCl) or Sulfate of Potash as soil side-dressing at 30-40 kg/ha.",
            "Fertigate with water-soluble 0-0-50 or 13-0-45 at 4-5 kg/ha twice a week during vegetative to fruiting stages."
        ],
        "organic_remedies": [
            "Incorporate clean wood ash (rich in soluble potash) lightly into surface soil at 100-150g per plant.",
            "Apply cold-water liquid seaweed kelp extract spray (2-3 ml/L) rich in bioavailable potassium and trace minerals.",
            "Mulch with banana peel compost or decomposed agricultural crop residues."
        ],
        "prevention": [
            "Check soil exchangeable potassium levels; ensure soil K:Mg balance does not induce nutrient lockouts.",
            "Maintain soil pH within 6.2 - 6.8 to optimize potassium root absorption.",
            "Apply potassium split doses throughout the fruit-bearing phase rather than a single basal application."
        ]
    },
    "N_K": {
        "title": "Combined Nitrogen & Potassium (N + K) Deficiency",
        "nutrient_element": "Nitrogen (N) & Potassium (K)",
        "nutrients": ["Nitrogen (N) Macronutrient", "Potassium (K) Macronutrient"],
        "is_healthy": False,
        "severity": "Critical",
        "agronomic_clarification": "Dual deficiency of primary NPK nutrients. 'K' refers to Potassium (Kalium) fertilizer, not human Vitamin K.",
        "primary_symptom": "Widespread chlorotic bleaching across the leaf lamina coupled with dry, brittle necrotic margin scorching. Leaves become leathery, curl inward, and suffer severe drop.",
        "physiological_role": "Compound shortage of both primary macronutrients halts vegetative biomass synthesis and disrupts plant osmoregulation, leading to dramatic yield collapse.",
        "chemical_remedies": [
            "Foliar application of Potassium Nitrate (13-0-45) at 10g/L + Urea at 5g/L for immediate leaf absorption.",
            "Fertigate with balanced water-soluble NPK 13-40-13 or 19-19-19 supplemented with SOP (0-0-50) at 5-7 kg/ha.",
            "Soil application of CAN (20 kg/ha) combined with Sulfate of Potash (25 kg/ha) around the plant basin."
        ],
        "organic_remedies": [
            "Heavy dressing of aged vermicompost blended with neem cake and wood ash around plant root zones.",
            "Drench roots with aerated compost tea and fermented bio-slurry enriched with liquid kelp extract."
        ],
        "prevention": [
            "Establish a comprehensive NPK fertigation schedule based on crop phenological stages.",
            "Avoid sandy soil nutrient leaching by utilizing drip irrigation with split nutrient pulses."
        ]
    },
    "K_Mg": {
        "title": "Combined Potassium & Magnesium (K + Mg) Deficiency",
        "nutrient_element": "Potassium (K) & Magnesium (Mg)",
        "nutrients": ["Potassium (K) Macronutrient", "Magnesium (Mg) Secondary Macronutrient"],
        "is_healthy": False,
        "severity": "Critical",
        "agronomic_clarification": "Shortage of Potassium (K from NPK fertilizer) and Magnesium (Mg). Plants do not suffer from Vitamin K deficiency.",
        "primary_symptom": "Intense interveinal chlorosis (yellowing between green veins) accompanied by scorched, burned leaf margins and necrotic bronzing on mature lower leaves.",
        "physiological_role": "Shortage of Magnesium (central atom of chlorophyll) combined with Potassium deficit impairs both light harvesting and carbohydrate transport.",
        "chemical_remedies": [
            "Foliar spray with Magnesium Sulfate (Epsom salt) at 10g/L + Potassium Nitrate (KNO3) at 8g/L.",
            "Apply agricultural Dolomitic limestone (if soil pH < 6.0) to supply calcium and magnesium while adjusting pH.",
            "Soil fertigation with water-soluble SOP (0-0-50) at 4 kg/ha and Magnesium Sulfate at 5 kg/ha."
        ],
        "organic_remedies": [
            "Apply composted farmyard manure enriched with crushed dolomite rock powder or green sand.",
            "Foliar spray of fermented seaweed extract combined with fulvic acid to facilitate magnesium/potassium uptake."
        ],
        "prevention": [
            "Monitor soil cation exchange ratio (Ca:Mg:K); excessive calcium can lock out potassium and magnesium.",
            "Keep soil well aerated to stimulate root respiration required for active cation uptake."
        ]
    },
    "N_Mg": {
        "title": "Combined Nitrogen & Magnesium (N + Mg) Deficiency",
        "nutrient_element": "Nitrogen (N) & Magnesium (Mg)",
        "nutrients": ["Nitrogen (N) Macronutrient", "Magnesium (Mg) Secondary Macronutrient"],
        "is_healthy": False,
        "severity": "Critical",
        "agronomic_clarification": "Simultaneous shortage of Nitrogen and Magnesium causing severe chlorophyll depletion.",
        "primary_symptom": "Extreme leaf chlorosis displaying both faded overall yellowing and distinct chevron/inverted-V shaped interveinal yellowing on mature foliage, causing premature defoliation.",
        "physiological_role": "Drastic depletion of chlorophyll synthesis components severely collapses photochemical energy production and carbon fixation.",
        "chemical_remedies": [
            "Foliar spray containing Urea (10g/L) plus Magnesium Sulfate / Epsom Salt (10g/L) with a non-ionic surfactant.",
            "Fertigate with Magnesium Nitrate (Mg(NO3)2) at 4-5 kg/ha providing both nitrogen and magnesium simultaneously.",
            "Soil application of Ammonium Sulfate (15 kg/ha) and agricultural Magnesium Sulfate (20 kg/ha)."
        ],
        "organic_remedies": [
            "Apply rich worm castings (vermicompost) mixed with dolomitic lime powder.",
            "Drench roots with diluted cattle urine and Jeevamruth supplemented with crushed neem seed powder."
        ],
        "prevention": [
            "Maintain soil pH within 6.0 to 6.5; acidic sandy soils frequently suffer simultaneous N and Mg leaching.",
            "Conduct routine leaf tissue analysis during early flowering to catch deficiencies before leaf necrosis occurs."
        ]
    },
    "healthy": {
        "title": "Healthy Leaf (Optimal Plant Nutrition)",
        "nutrient_element": "Balanced (N, P, K, Ca, Mg, S)",
        "nutrients": ["Balanced Macronutrients (N, P, K, Ca, Mg, S)"],
        "is_healthy": True,
        "severity": "Normal",
        "agronomic_clarification": "Leaf exhibits balanced nutritional physiology with optimal N-P-K macronutrients.",
        "primary_symptom": "Vibrant, uniform green foliage with smooth lamina, healthy veins, robust turgidity, and zero signs of chlorosis, necrosis, or edge scorching.",
        "physiological_role": "Plant maintains optimal chlorophyll density, active stomatal conductance, and balanced nutrient transport supporting vigorous flowering and fruit set.",
        "chemical_remedies": [
            "Maintain current standard fertigation program without altering nutrient ratios.",
            "Ensure regular micronutrient maintenance foliar spray (zinc, boron, iron, manganese) every 20-30 days."
        ],
        "organic_remedies": [
            "Continue periodic mulching with organic crop residues and light vermicompost applications.",
            "Maintain soil microbial biodiversity with biostimulant or mycorrhizal inoculants."
        ],
        "prevention": [
            "Monitor soil moisture levels with tensiometers to avoid water stress or nutrient leaching.",
            "Conduct seasonal soil testing to sustain soil fertility balance."
        ]
    }
}

def get_nutrient_deficiency_info(class_name: str) -> Dict[str, Any]:
    """
    Parses a class name in the format '<crop>__<condition>' (e.g. 'tomato__N_K')
    and returns comprehensive crop agronomy, symptoms, and remedial recommendations.
    """
    clean_name = class_name.strip()
    
    if "__" in clean_name:
        parts = clean_name.split("__", 1)
        crop_key = parts[0].lower().strip()
        cond_key = parts[1].strip()
    else:
        crop_key = "unknown"
        cond_key = clean_name

    crop_display = CROP_NAMES_MAP.get(crop_key, crop_key.replace("_", " ").title())
    deficiency_data = DEFICIENCY_DETAILS.get(cond_key, DEFICIENCY_DETAILS.get("healthy"))

    return {
        "class_name": clean_name,
        "crop_key": crop_key,
        "crop_name": crop_display,
        "condition_key": cond_key,
        "deficiency_title": deficiency_data["title"],
        "nutrient_element": deficiency_data.get("nutrient_element", "General Nutrition"),
        "agronomic_clarification": deficiency_data.get("agronomic_clarification", ""),
        "is_healthy": deficiency_data["is_healthy"],
        "severity": deficiency_data["severity"],
        "nutrients_involved": deficiency_data["nutrients"],
        "primary_symptom": deficiency_data["primary_symptom"],
        "physiological_role": deficiency_data["physiological_role"],
        "chemical_remedies": deficiency_data["chemical_remedies"],
        "organic_remedies": deficiency_data["organic_remedies"],
        "prevention": deficiency_data["prevention"]
    }
