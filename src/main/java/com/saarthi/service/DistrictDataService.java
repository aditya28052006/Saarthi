package com.saarthi.service;

import com.saarthi.model.MapDataResponse;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DistrictDataService {

    public static final List<String> BLOCKS = Arrays.asList(
            "Sunam", "Sangrur", "Dhuri", "Moonak", "Lehragaga", "Malerkotla", "Amargarh", "Bhawanigarh"
    );

    public static final Map<String, List<String>> BLOCK_PANCHAYATS = new LinkedHashMap<>();
    public static final Map<String, Map<String, Double>> BLOCK_CONDITIONS = new LinkedHashMap<>();
    public static final Map<String, Map<String, Object>> BLOCK_DETAILS = new LinkedHashMap<>();
    public static final Map<String, String[]> MONSOON_WINDOWS = new LinkedHashMap<>();
    public static final List<MapDataResponse.VillageData> VILLAGE_GEO_MAP = new ArrayList<>();

    static {
        // 8 Blocks & 1,200+ Panchayats Representation
        BLOCK_PANCHAYATS.put("Sunam", Arrays.asList(
                "Suler Gherat", "Kularan", "Chhajli", "Dirba", "Cheema", "Mehlan", "Ubhawal",
                "Togawal", "Shahpur Kaler", "Bigarwal", "Dhandiwal", "Mauran", "Namol",
                "Jakhepal", "Janal", "Khanal Kalan", "Khanal Khurd", "Kauhar Singh Wala"
        ));

        BLOCK_PANCHAYATS.put("Sangrur", Arrays.asList(
                "Bhalwan", "Mangwal", "Ubhawal", "Kanganwal", "Badrukhan", "Ladda",
                "Akoi Sahib", "Ghabdan", "Duggan", "Khurana", "Bhawanigarh Road",
                "Fatehgarh Chhanna", "Soian", "Uppli", "Gharachon", "Bahadurpur"
        ));

        BLOCK_PANCHAYATS.put("Dhuri", Arrays.asList(
                "Rangian", "Maanwala", "Benra", "Kalerian", "Babbanpur", "Jahangir",
                "Ranike", "Mullowal", "Mimsa", "Bardwal", "Pakhoke", "Rajomajra",
                "Daulatpur", "Bhulran", "Bhalwan Dhuri", "Bugra"
        ));

        BLOCK_PANCHAYATS.put("Moonak", Arrays.asList(
                "Moonak Rural", "Ghamoor Ghat", "Makror Sahib", "Kakra", "Mandvi",
                "Hamirgarh", "Surjan Bhaini", "Lehal Khurd", "Balran", "Dehla",
                "Bhundar Bhaini", "Ramnagar Sibian", "Banawali", "Bushehra"
        ));

        BLOCK_PANCHAYATS.put("Lehragaga", Arrays.asList(
                "Lehal Kalan", "Kotra Amru", "Chhajli Khurd", "Sangha", "Alampur",
                "Gaga", "Dhadrian", "Bakhoran Kalan", "Sekhuwas", "Bhutal Kalan",
                "Chotian", "Khokhar", "Anderana", "Balran Lehra"
        ));

        BLOCK_PANCHAYATS.put("Malerkotla", Arrays.asList(
                "Ahmedgarh Rural", "Amargarh Border", "Kup Kalan", "Himmatpura",
                "Jamalpura", "Sandaur", "Bhadas", "Mithewal", "Maholi Kalan",
                "Nathuwala", "Rohira", "Chaunda", "Balyal"
        ));

        BLOCK_PANCHAYATS.put("Amargarh", Arrays.asList(
                "Amargarh Central", "Mubarakpur", "Bhasaur", "Himmatpura North",
                "Bagrian", "Chaunda Khurd", "Naraingarh", "Jalwana", "Ladda Kalan",
                "Bhogiwal", "Salana", "Alipur Amargarh"
        ));

        BLOCK_PANCHAYATS.put("Bhawanigarh", Arrays.asList(
                "Bhawanigarh Rural", "Kularan South", "Nadampur", "Sular Gharat",
                "Balad Kalan", "Majhi", "Jhaneri", "Phagguwala", "Noorpur",
                "Gharachon West", "Fatehgarh", "Bakhopai"
        ));

        // Block Conditions (6-feature vector)
        addConditions("Sunam", 3.0, 9.0, 19.0, 38.0, 5.0, 10.0);
        addConditions("Sangrur", 5.0, 12.0, 28.0, 54.0, 4.0, 8.0);
        addConditions("Dhuri", 11.0, 31.0, 62.0, 110.0, 2.0, 5.0);
        addConditions("Moonak", 8.0, 22.0, 48.0, 88.0, 3.0, 6.0);
        addConditions("Lehragaga", 2.0, 7.0, 16.0, 31.0, 6.0, 11.0);
        addConditions("Malerkotla", 17.0, 42.0, 79.0, 142.0, 1.0, 3.0);
        addConditions("Amargarh", 14.0, 36.0, 72.0, 128.0, 2.0, 4.0);
        addConditions("Bhawanigarh", 6.0, 17.0, 41.0, 75.0, 4.0, 7.0);

        // Block Details
        addBlockDetail("Sunam", "31 Aug · 08:15 IST", 56, "Low (24%)", 24,
                "Hold sowing across Sunam. Conserve moisture with light mulching and line up irrigation before planting.",
                Arrays.asList(new Object[]{"North-east", 19, "Cheema"}, new Object[]{"Central farms", 24, "Khanal Kalan"}, new Object[]{"South-west", 78, "Chhajli"}, new Object[]{"Canal fringe", 68, "Dirba"}));

        addBlockDetail("Sangrur", "31 Aug · 08:30 IST", 68, "Adequate (38%)", 38,
                "Do not sow in north-west lowlands yet. Prepare seed beds on raised rows and reassess after next rain.",
                Arrays.asList(new Object[]{"North-west", 76, "Bhalwan"}, new Object[]{"Central belt", 55, "Mangwal"}, new Object[]{"South-east", 34, "Ubhawal"}, new Object[]{"River-side", 61, "Kanganwal"}));

        addBlockDetail("Dhuri", "31 Aug · 09:00 IST", 73, "Good (44%)", 44,
                "Suitable for sowing on prepared fields. Prioritise central belt and avoid south-west depression.",
                Arrays.asList(new Object[]{"North village", 54, "Kalerian"}, new Object[]{"Central belt", 69, "Rangian"}, new Object[]{"South-west", 78, "Maanwala"}, new Object[]{"East farms", 58, "Benra"}));

        addBlockDetail("Moonak", "31 Aug · 08:50 IST", 64, "Moderate (32%)", 32,
                "Keep seed ready but review forecast in 3 days. Early sowing safer in eastern fields.",
                Arrays.asList(new Object[]{"North farms", 39, "Ghamoor Ghat"}, new Object[]{"Central belt", 47, "Moonak"}, new Object[]{"East fields", 62, "Makror Sahib"}, new Object[]{"South plots", 35, "Kakra"}));

        addBlockDetail("Lehragaga", "31 Aug · 08:20 IST", 49, "Very low (19%)", 19,
                "Wait before sowing. Lehragaga needs sustained rain; protect existing seedlings with supplemental irrigation.",
                Arrays.asList(new Object[]{"North ridge", 82, "Lehal Kalan"}, new Object[]{"Central plain", 75, "Kotra Amru"}, new Object[]{"South farms", 71, "Bakhoran Kalan"}, new Object[]{"Canal side", 64, "Sangha"}));

        addBlockDetail("Malerkotla", "31 Aug · 08:45 IST", 81, "High (52%)", 52,
                "Sow in well-drained central and eastern plots. Avoid waterlogged pockets and keep drains open.",
                Arrays.asList(new Object[]{"North farms", 81, "Ahmedgarh"}, new Object[]{"Old city belt", 63, "Amargarh"}, new Object[]{"East plots", 72, "Kup Kalan"}, new Object[]{"South lowlands", 88, "Himmatpura"}));

        addBlockDetail("Amargarh", "31 Aug · 09:10 IST", 77, "Good (46%)", 46,
                "Conditions are suitable in well-drained fields. Check low-lying plots after showers before planting.",
                Arrays.asList(new Object[]{"North farms", 68, "Amargarh"}, new Object[]{"Central belt", 73, "Mubarakpur"}, new Object[]{"East fields", 59, "Bhasaur"}, new Object[]{"South plots", 64, "Himmatpura"}));

        addBlockDetail("Bhawanigarh", "31 Aug · 08:40 IST", 61, "Moderate (33%)", 33,
                "Review rainfall in 3 days. Prefer moisture-retaining plots and keep irrigation available for new seedlings.",
                Arrays.asList(new Object[]{"North farms", 47, "Nadampur"}, new Object[]{"Central belt", 51, "Bhawanigarh"}, new Object[]{"East fields", 38, "Balad Kalan"}, new Object[]{"South plots", 72, "Sular Gharat"}));

        // Seasonal Windows
        MONSOON_WINDOWS.put("Sunam", new String[]{"7–10 Sep", "21–26 Sep"});
        MONSOON_WINDOWS.put("Sangrur", new String[]{"4–7 Sep", "24–29 Sep"});
        MONSOON_WINDOWS.put("Dhuri", new String[]{"3–6 Sep", "26 Sep–1 Oct"});
        MONSOON_WINDOWS.put("Moonak", new String[]{"5–8 Sep", "23–28 Sep"});
        MONSOON_WINDOWS.put("Lehragaga", new String[]{"8–12 Sep", "20–25 Sep"});
        MONSOON_WINDOWS.put("Malerkotla", new String[]{"2–5 Sep", "25–30 Sep"});
        MONSOON_WINDOWS.put("Amargarh", new String[]{"2–5 Sep", "25–30 Sep"});
        MONSOON_WINDOWS.put("Bhawanigarh", new String[]{"5–9 Sep", "23–28 Sep"});

        // 31 Village Coordinates for Leaflet GIS Map
        addVillage("Suler Gherat", "Sunam", 30.0821, 75.8124, 74, "Clay Loam");
        addVillage("Kularan", "Sunam", 30.1235, 75.8641, 42, "Alluvial");
        addVillage("Chhajli", "Sunam", 30.0412, 75.7621, 78, "Sandy Loam");
        addVillage("Dirba", "Sunam", 30.0654, 75.9812, 68, "Clay Loam");
        addVillage("Cheema", "Sunam", 30.0921, 75.7012, 28, "Alluvial");
        addVillage("Mehlan", "Sunam", 30.1741, 75.8912, 52, "Silt Loam");
        addVillage("Bhalwan", "Sangrur", 30.2912, 75.8112, 76, "Sandy Loam");
        addVillage("Mangwal", "Sangrur", 30.2214, 75.8341, 55, "Alluvial");
        addVillage("Ubhawal", "Sangrur", 30.1982, 75.8741, 34, "Clay Loam");
        addVillage("Kanganwal", "Sangrur", 30.2641, 75.9112, 61, "Silt Loam");
        addVillage("Badrukhan", "Sangrur", 30.2014, 75.7912, 48, "Alluvial");
        addVillage("Rangian", "Dhuri", 30.3412, 75.8712, 69, "Alluvial");
        addVillage("Maanwala", "Dhuri", 30.3812, 75.8312, 78, "Clay Loam");
        addVillage("Benra", "Dhuri", 30.3912, 75.9212, 58, "Alluvial");
        addVillage("Kalerian", "Dhuri", 30.4121, 75.8512, 54, "Silt Loam");
        addVillage("Ghamoor Ghat", "Moonak", 29.8912, 75.8712, 39, "Sandy Loam");
        addVillage("Makror Sahib", "Moonak", 29.8412, 75.9312, 62, "Clay Loam");
        addVillage("Kakra", "Moonak", 29.8112, 75.8812, 35, "Alluvial");
        addVillage("Mandvi", "Moonak", 29.8612, 75.9912, 51, "Alluvial");
        addVillage("Lehal Kalan", "Lehragaga", 29.9812, 75.8112, 82, "Sandy Loam");
        addVillage("Kotra Amru", "Lehragaga", 29.9512, 75.8512, 75, "Clay Loam");
        addVillage("Sangha", "Lehragaga", 29.9112, 75.7912, 64, "Alluvial");
        addVillage("Bakhoran Kalan", "Lehragaga", 29.9312, 75.8812, 71, "Sandy Loam");
        addVillage("Ahmedgarh Rural", "Malerkotla", 30.6812, 75.8312, 81, "Alluvial");
        addVillage("Kup Kalan", "Malerkotla", 30.5612, 75.8912, 72, "Clay Loam");
        addVillage("Himmatpura", "Malerkotla", 30.4912, 75.8112, 88, "Silt Loam");
        addVillage("Mubarakpur", "Amargarh", 30.5112, 75.9812, 73, "Alluvial");
        addVillage("Bhasaur", "Amargarh", 30.4712, 76.0112, 59, "Clay Loam");
        addVillage("Nadampur", "Bhawanigarh", 30.2512, 76.0712, 47, "Alluvial");
        addVillage("Sular Gharat", "Bhawanigarh", 30.2112, 76.0212, 72, "Clay Loam");
        addVillage("Balad Kalan", "Bhawanigarh", 30.2812, 76.0412, 38, "Silt Loam");
    }

    private static void addConditions(String block, double r3, double r7, double r14, double r30, double d7, double d14) {
        Map<String, Double> m = new LinkedHashMap<>();
        m.put("rain_3d", r3);
        m.put("rain_7d", r7);
        m.put("rain_14d", r14);
        m.put("rain_30d", r30);
        m.put("dry_days_7d", d7);
        m.put("dry_days_14d", d14);
        BLOCK_CONDITIONS.put(block, m);
    }

    private static void addBlockDetail(String block, String updated, int humidity, String soilMoisture, int soilVal, String advice, List<Object[]> zones) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("updated", updated);
        m.put("humidity", humidity);
        m.put("soil_moisture", soilMoisture);
        m.put("soil_val", soilVal);
        m.put("advice", advice);
        m.put("zones", zones);
        BLOCK_DETAILS.put(block, m);
    }

    private static void addVillage(String name, String block, double lat, double lng, int risk, String soil) {
        String level = risk >= 60 ? "High" : risk >= 30 ? "Moderate" : "Low";
        String decision = risk >= 60 ? "WAIT 7 DAYS" : risk >= 30 ? "EXERCISE CAUTION" : "SAFE TO SOW";
        String advisory = risk >= 60 ? "Prolonged dry break expected. Delay sowing & protect root moisture." :
                risk >= 30 ? "Rainfall uncertain; review outlook in 3 days." : "Moisture profile optimal; safe to proceed with sowing.";
        int moisture = Math.max(18, 52 - (int)(risk * 0.45));
        VILLAGE_GEO_MAP.add(new MapDataResponse.VillageData(
                name, block, lat, lng, risk, level, soil, moisture + "%", decision, advisory
        ));
    }

    public List<String> getBlocks() { return BLOCKS; }
    public List<String> getPanchayats(String block) { return BLOCK_PANCHAYATS.getOrDefault(block, BLOCK_PANCHAYATS.get("Sunam")); }
    public Map<String, Double> getConditions(String block) { return BLOCK_CONDITIONS.getOrDefault(block, BLOCK_CONDITIONS.get("Sangrur")); }
    public Map<String, Object> getBlockDetails(String block) { return BLOCK_DETAILS.getOrDefault(block, BLOCK_DETAILS.get("Sangrur")); }
    public String[] getMonsoonWindow(String block) { return MONSOON_WINDOWS.getOrDefault(block, new String[]{"4–7 Sep", "24–29 Sep"}); }
    public List<MapDataResponse.VillageData> getVillages() { return VILLAGE_GEO_MAP; }
}
