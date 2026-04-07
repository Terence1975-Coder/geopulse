def sic_codes_to_labels(sic_codes):
    mapping = {
        "45111": "Sale of new cars and light motor vehicles",
        "45112": "Sale of used cars and light motor vehicles",
        "45200": "Maintenance and repair of motor vehicles",
        "49410": "Freight transport by road",
        "52290": "Other transportation support activities",
        "35110": "Production of electricity",
        "35120": "Transmission of electricity",
        "35130": "Distribution of electricity",
        "35140": "Trade of electricity",
        "43210": "Electrical installation",
        "62012": "Business and domestic software development",
        "62020": "IT consultancy activities",
        "70229": "Management consultancy activities",
    }
    return [mapping.get(code, f"SIC {code}") for code in (sic_codes or [])]