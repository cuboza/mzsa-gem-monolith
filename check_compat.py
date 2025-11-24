import json

def check_compatibility_fields():
    try:
        with open('backend/db.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            trailers = data.get('trailers', [])
            
            print(f"Total trailers: {len(trailers)}")
            
            missing_length = 0
            missing_width = 0
            missing_weight = 0
            
            for t in trailers:
                if not t.get('maxVehicleLength'):
                    missing_length += 1
                if not t.get('maxVehicleWidth'):
                    missing_width += 1
                if not t.get('maxVehicleWeight'):
                    missing_weight += 1
                    
            print(f"Missing maxVehicleLength: {missing_length}")
            print(f"Missing maxVehicleWidth: {missing_width}")
            print(f"Missing maxVehicleWeight: {missing_weight}")
            
            # List some examples of missing fields
            if missing_length > 0:
                print("\nExamples with missing length:")
                for t in trailers[:5]:
                    if not t.get('maxVehicleLength'):
                        print(f"- {t.get('model')} ({t.get('id')})")

    except FileNotFoundError:
        print("backend/db.json not found")

if __name__ == "__main__":
    check_compatibility_fields()
