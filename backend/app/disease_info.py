from typing import Dict, Any

DISEASE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    "Apple___Apple_scab": {
        "crop": "Apple",
        "disease": "Apple Scab (Venturia inaequalis)",
        "is_healthy": False,
        "symptoms": "Olive-green to dark brown velvety spots on upper leaf surfaces and scabby lesions on fruit.",
        "management": [
            "Rake and destroy fallen leaves in autumn to reduce overwintering fungal spores.",
            "Prune canopy branches to improve air circulation and rapid leaf drying.",
            "Apply protective fungicides (Captan or sulfur) during primary spring bud break."
        ]
    },
    "Apple___Black_rot": {
        "crop": "Apple",
        "disease": "Black Rot (Diplodia seriata)",
        "is_healthy": False,
        "symptoms": "Frogeye leaf spots with purple borders, rotting fruit with concentric rings, and branch cankers.",
        "management": [
            "Prune out dead wood, fire blight strikes, and mummified fruits hanging on trees.",
            "Sterilize pruning equipment between cuts with 70% alcohol or bleach solution.",
            "Apply copper-based sprays or strobilurin fungicides after petal fall."
        ]
    },
    "Apple___Cedar_apple_rust": {
        "crop": "Apple",
        "disease": "Cedar Apple Rust (Gymnosporangium juniperi-virginianae)",
        "is_healthy": False,
        "symptoms": "Bright yellow-orange leaf spots that turn reddish with tube-like spore structures on lower leaf surface.",
        "management": [
            "Remove nearby Eastern red cedar and juniper hosts within 1-2 miles if possible.",
            "Select rust-resistant apple cultivars such as Freedom, Liberty, or Enterprise.",
            "Apply myclobutanil or mancozeb fungicides from pink bud through petal fall."
        ]
    },
    "Apple___healthy": {
        "crop": "Apple",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Vibrant green foliage with no fungal, bacterial, or necrotic lesions.",
        "management": [
            "Continue regular watering, balanced soil fertilization, and monitoring."
        ]
    },
    "Blueberry___healthy": {
        "crop": "Blueberry",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Uniform green foliage free of spots, chlorosis, or necrotic margins.",
        "management": [
            "Maintain acidic soil pH (4.5–5.5) and adequate pine bark or organic mulch."
        ]
    },
    "Cherry_(including_sour)___Powdery_mildew": {
        "crop": "Cherry",
        "disease": "Powdery Mildew (Podosphaera clandestina)",
        "is_healthy": False,
        "symptoms": "White powdery fungal mycelium covering young leaves, curling margins, and shoot stunting.",
        "management": [
            "Ensure open tree architecture for sunlight penetration.",
            "Apply horticultural oils, potassium bicarbonate, or sulfur sprays at early sign of infection.",
            "Avoid excessive nitrogen fertilization which promotes susceptible tender shoot flushes."
        ]
    },
    "Cherry_(including_sour)___healthy": {
        "crop": "Cherry",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Healthy dark green cherry foliage without spotting, curling, or mildew.",
        "management": [
            "Maintain routine orchard sanitation and seasonal dormant oil sprays."
        ]
    },
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "crop": "Corn (Maize)",
        "disease": "Gray Leaf Spot (Cercospora zeae-maydis)",
        "is_healthy": False,
        "symptoms": "Tan to gray rectangular lesions strictly bounded by leaf veins.",
        "management": [
            "Rotate crops with non-grasses (such as soybean) for at least 1-2 years.",
            "Plant corn hybrids with high resistance ratings against gray leaf spot.",
            "Apply foliar triazole or strobilurin fungicides at early tasseling if disease pressure is high."
        ]
    },
    "Corn_(maize)___Common_rust_": {
        "crop": "Corn (Maize)",
        "disease": "Common Rust (Puccinia sorghi)",
        "is_healthy": False,
        "symptoms": "Cinnamon-brown pustules scattered across both upper and lower leaf surfaces.",
        "management": [
            "Plant resistant corn hybrids carrying the Rp gene.",
            "In high-value sweet corn, apply pyraclostrobin or azoxystrobin fungicides if pustules appear prior to silking."
        ]
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "crop": "Corn (Maize)",
        "disease": "Northern Corn Leaf Blight (Exserohilum turcicum)",
        "is_healthy": False,
        "symptoms": "Large cigar-shaped grayish-green to tan lesions (1 to 6 inches long).",
        "management": [
            "Use certified resistant hybrids.",
            "Incorporate crop residue into the soil to hasten fungal decomposition.",
            "Apply foliar fungicides at VT-R1 growth stage if lesions reach the ear leaf."
        ]
    },
    "Corn_(maize)___healthy": {
        "crop": "Corn (Maize)",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Robust green corn leaf with distinct parallel venation and no pustules or blights.",
        "management": [
            "Maintain nitrogen side-dressing and weed management."
        ]
    },
    "Grape___Black_rot": {
        "crop": "Grape",
        "disease": "Black Rot (Guignardia bidwellii)",
        "is_healthy": False,
        "symptoms": "Small brown circular leaf spots with dark margins and tiny black pycnidia; shriveled black berries.",
        "management": [
            "Remove all mummified fruit clusters during winter pruning.",
            "Ensure good vineyard air flow through trellis shoot positioning.",
            "Apply myclobutanil or mancozeb from bud break until veraison."
        ]
    },
    "Grape___Esca_(Black_Measles)": {
        "crop": "Grape",
        "disease": "Esca / Black Measles (Phaeomoniella / Phaeoacremonium)",
        "is_healthy": False,
        "symptoms": "Tiger-stripe interveinal necrosis on leaves and dark speckling on berries.",
        "management": [
            "Protect pruning wounds with wound sealants or Trichoderma biocontrols.",
            "Avoid pruning in wet weather when fungal airborne spores are prevalent.",
            "Prune infected trunk wood back to healthy tissue."
        ]
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "crop": "Grape",
        "disease": "Leaf Blight (Pseudocercospora vitis / Isariopsis)",
        "is_healthy": False,
        "symptoms": "Irregular necrotic brown lesions on foliage leading to premature defoliation.",
        "management": [
            "Post-harvest copper oxychloride spray to protect canopy longevity.",
            "Canopy management to facilitate rapid morning drying."
        ]
    },
    "Grape___healthy": {
        "crop": "Grape",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Healthy vine canopy with lush green leaves and intact margins.",
        "management": [
            "Maintain balanced shoot thinning and irrigation."
        ]
    },
    "Orange___Haunglongbing_(Citrus_greening)": {
        "crop": "Orange / Citrus",
        "disease": "Huanglongbing / Citrus Greening (Candidatus Liberibacter)",
        "is_healthy": False,
        "symptoms": "Asymmetric blotchy mottle chlorosis on leaves, small lopsided bitter fruit with inverted coloration.",
        "management": [
            "Rigorous vector control against Asian citrus psyllid (Diaphorina citri).",
            "Remove and destroy verified infected trees to prevent orchard-wide transmission.",
            "Use certified pathogen-free nursery stock in enclosed screenhouses."
        ]
    },
    "Peach___Bacterial_spot": {
        "crop": "Peach",
        "disease": "Bacterial Spot (Xanthomonas arboricola pv. pruni)",
        "is_healthy": False,
        "symptoms": "Angular water-soaked leaf spots turning purple-brown, shot-hole effect as center drops out.",
        "management": [
            "Avoid high nitrogen rates that create excessively vigorous tender shoots.",
            "Apply copper bactericides during dormancy and oxytetracycline during the growing season.",
            "Choose tolerant peach cultivars."
        ]
    },
    "Peach___healthy": {
        "crop": "Peach",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Bright lanceolate green peach foliage without shot-hole perforations or necrosis.",
        "management": [
            "Apply standard dormant copper wash and monitor for aphids."
        ]
    },
    "Pepper,_bell___Bacterial_spot": {
        "crop": "Bell Pepper",
        "disease": "Bacterial Spot (Xanthomonas campestris pv. vesicatoria)",
        "is_healthy": False,
        "symptoms": "Small water-soaked or circular lesions with yellow halos on leaves, dropping leaves prematurely.",
        "management": [
            "Use hot water-treated or certified disease-free seeds.",
            "Avoid overhead sprinkler irrigation to reduce splash dispersal.",
            "Apply copper-mancozeb tank mixes or biological bactericides (Bacillus subtilis)."
        ]
    },
    "Pepper,_bell___healthy": {
        "crop": "Bell Pepper",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Healthy dark green pepper leaf with crisp edges and no lesions.",
        "management": [
            "Maintain consistent drip watering and balanced calcium/potassium nutrition."
        ]
    },
    "Potato___Early_blight": {
        "crop": "Potato",
        "disease": "Early Blight (Alternaria solani)",
        "is_healthy": False,
        "symptoms": "Dark brown circular spots with concentric target-board rings surrounded by chlorotic yellow zone.",
        "management": [
            "Practice 2-3 year crop rotation away from solanaceous crops.",
            "Maintain optimal plant vigor with adequate potassium and nitrogen.",
            "Apply chlorothalonil, mancozeb, or azoxystrobin fungicides preventatively."
        ]
    },
    "Potato___Late_blight": {
        "crop": "Potato",
        "disease": "Late Blight (Phytophthora infestans)",
        "is_healthy": False,
        "symptoms": "Fast-spreading water-soaked dark lesions with white fuzzy mold growth on the leaf underside under high humidity.",
        "management": [
            "Destroy volunteer potato plants and cull piles.",
            "Plant certified late-blight-free seed tubers.",
            "Spray systemic fungicides (such as cymoxanil, dimethomorph, or metalaxyl) immediately upon favorable weather."
        ]
    },
    "Potato___healthy": {
        "crop": "Potato",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Vigorous green compound potato leaf without blight or yellowing.",
        "management": [
            "Keep potato hills hilled up and monitor soil moisture."
        ]
    },
    "Raspberry___healthy": {
        "crop": "Raspberry",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Clean serrated raspberry leaves without rust, cane blight, or mosaic patterns.",
        "management": [
            "Trellis canes for air movement and prune old floricanes after fruiting."
        ]
    },
    "Soybean___healthy": {
        "crop": "Soybean",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Trifoliate green leaves free of septoria brown spot, frogeye, or bacterial pustules.",
        "management": [
            "Maintain proper plant spacing and crop scouting."
        ]
    },
    "Squash___Powdery_mildew": {
        "crop": "Squash",
        "disease": "Powdery Mildew (Podosphaera xanthii)",
        "is_healthy": False,
        "symptoms": "White talcum-powder-like spots on leaves and stems, causing premature leaf yellowing and death.",
        "management": [
            "Plant resistant squash varieties.",
            "Spray neem oil, potassium bicarbonate, or potassium silicate at first symptom detection.",
            "Ensure full sun exposure and wide row spacing."
        ]
    },
    "Strawberry___Leaf_scorch": {
        "crop": "Strawberry",
        "disease": "Leaf Scorch (Diplocarpon earlianum)",
        "is_healthy": False,
        "symptoms": "Numerous purplish, irregular spots on leaves that coalesce, causing the leaf margin to curl up and scorch.",
        "management": [
            "Mow and remove infected foliage immediately following harvest.",
            "Avoid overhead irrigation; use drip tapes.",
            "Apply protective fungicides (Captan or dodine) during early spring regrowth."
        ]
    },
    "Strawberry___healthy": {
        "crop": "Strawberry",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Vibrant trifoliate strawberry foliage with glossy surface and clear veins.",
        "management": [
            "Maintain straw mulch under berries and uniform moisture."
        ]
    },
    "Tomato___Bacterial_spot": {
        "crop": "Tomato",
        "disease": "Bacterial Spot (Xanthomonas perforans)",
        "is_healthy": False,
        "symptoms": "Small, greasy or water-soaked dark brown spots with chlorotic margins; defoliation in warm wet periods.",
        "management": [
            "Use certified pathogen-free seed and clean greenhouse transplants.",
            "Apply fixed copper combined with mancozeb or bacteriophage products.",
            "Strictly avoid working with wet plants to prevent spreading bacteria."
        ]
    },
    "Tomato___Early_blight": {
        "crop": "Tomato",
        "disease": "Early Blight (Alternaria linariae)",
        "is_healthy": False,
        "symptoms": "Brown to black lesions with concentric rings (target pattern) starting on lower oldest leaves.",
        "management": [
            "Stake plants and mulch soil heavily to prevent soil splash onto lower leaves.",
            "Prune lowest leaves to improve airflow and keep foliage dry.",
            "Spray chlorothalonil, copper, or difenoconazole as lower leaves show symptoms."
        ]
    },
    "Tomato___Late_blight": {
        "crop": "Tomato",
        "disease": "Late Blight (Phytophthora infestans)",
        "is_healthy": False,
        "symptoms": "Large water-soaked dark olive lesions with pale borders; white sporulation under humid conditions; greasy brown fruit rot.",
        "management": [
            "Remove and bag heavily infected plants immediately; do not compost.",
            "Apply preventive fungicides before humid cool rain events.",
            "Select resistant tomato cultivars like Defiant, Mountain Merit, or Iron Lady."
        ]
    },
    "Tomato___Leaf_Mold": {
        "crop": "Tomato",
        "disease": "Leaf Mold (Passalora fulva)",
        "is_healthy": False,
        "symptoms": "Pale greenish-yellow spots on upper leaf surface corresponding to velvety olive-green mold on the underside.",
        "management": [
            "Increase greenhouse or hoop-house ventilation to reduce relative humidity below 85%.",
            "Keep leaves dry with drip irrigation.",
            "Apply copper fungicides or bio-fungicides (Bacillus amyloliquefaciens)."
        ]
    },
    "Tomato___Septoria_leaf_spot": {
        "crop": "Tomato",
        "disease": "Septoria Leaf Spot (Septoria lycopersici)",
        "is_healthy": False,
        "symptoms": "Numerous circular small spots with grayish-white centers, dark brown borders, and tiny black fruiting bodies.",
        "management": [
            "Remove lower infected leaves early in the season.",
            "Ensure a 3-year solanaceous crop rotation.",
            "Apply protective fungicides (chlorothalonil or copper) every 7-10 days in wet seasons."
        ]
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "crop": "Tomato",
        "disease": "Two-spotted Spider Mite (Tetranychus urticae)",
        "is_healthy": False,
        "symptoms": "Yellow stippling and speckled foliage with fine silken webbing on leaf undersides in dry hot weather.",
        "management": [
            "Release predatory mites (Phytoseiulus persimilis) in greenhouses.",
            "Apply insecticidal soap, neem oil, or sulfur (avoid sulfur above 32°C).",
            "Maintain plant hydration to deter spider mite population explosions."
        ]
    },
    "Tomato___Target_Spot": {
        "crop": "Tomato",
        "disease": "Target Spot (Corynespora cassiicola)",
        "is_healthy": False,
        "symptoms": "Small brown circular lesions with light brown centers and faint concentric circles on leaves and stems.",
        "management": [
            "Improve plant spacing and pruning for canopy airflow.",
            "Rotate crops and avoid continuous tomato cultivation.",
            "Apply fungicides such as azoxystrobin or boscalid."
        ]
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "crop": "Tomato",
        "disease": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "is_healthy": False,
        "symptoms": "Severe stunting, upward curling and cupping of leaflets with marked interveinal yellowing; flowers drop.",
        "management": [
            "Aggressive control of the whitefly vector (Bemisia tabaci) using fine insect netting and yellow sticky traps.",
            "Plant TYLCV-resistant hybrids.",
            "Rogue out and destroy infected young plants immediately."
        ]
    },
    "Tomato___Tomato_mosaic_virus": {
        "crop": "Tomato",
        "disease": "Tomato Mosaic Virus (ToMV)",
        "is_healthy": False,
        "symptoms": "Mottled light and dark green mosaic patterns on leaves, fern-like distorted leaf shape, and stunted growth.",
        "management": [
            "Wash hands and dip tools in skim milk or disinfectant before touching plants.",
            "Do not smoke or use tobacco products near plants (risk of mechanical transmission).",
            "Disinfect stakes and trellises before reuse."
        ]
    },
    "Tomato___healthy": {
        "crop": "Tomato",
        "disease": "Healthy Leaf",
        "is_healthy": True,
        "symptoms": "Dark green, vibrant tomato foliage without mottling, target lesions, or wilting.",
        "management": [
            "Continue standard staking, suckering, drip watering, and monitoring."
        ]
    }
}

def get_disease_info(class_name: str) -> Dict[str, Any]:
    if class_name in DISEASE_KNOWLEDGE_BASE:
        return DISEASE_KNOWLEDGE_BASE[class_name]
    
    # Generic fallback
    parts = class_name.split("___")
    crop = parts[0].replace("_", " ")
    disease = parts[1].replace("_", " ") if len(parts) > 1 else "Unknown"
    is_healthy = "healthy" in class_name.lower()
    
    return {
        "crop": crop,
        "disease": disease,
        "is_healthy": is_healthy,
        "symptoms": "No specific field symptoms recorded for this custom label.",
        "management": [
            "Isolate affected crop plants and consult local agricultural extension specialists."
        ]
    }
