import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for the frontend

# Firebase Configuration
PROJECT_ID = "mini-cart-70c14"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

# Beautiful default products to seed the database if it is empty
DEFAULT_PRODUCTS = [
    {
        "title": "Mens Winter Leather Jacket",
        "category": "Jacket",
        "price": 48.00,
        "oldPrice": 75.00,
        "badge": "15%",
        "imgSrcDefault": "./assets/images/products/jacket-3.jpg",
        "imgSrcHover": "./assets/images/products/jacket-4.jpg",
        "rating": 4
    },
    {
        "title": "Pure Garment-Dyed Cotton Shirt",
        "category": "Shirt",
        "price": 45.00,
        "oldPrice": 56.00,
        "badge": "sale",
        "imgSrcDefault": "./assets/images/products/shirt-1.jpg",
        "imgSrcHover": "./assets/images/products/shirt-2.jpg",
        "rating": 5
    },
    {
        "title": "Black Treck Running Shoes",
        "category": "Sports",
        "price": 58.00,
        "oldPrice": 65.00,
        "badge": "new",
        "imgSrcDefault": "./assets/images/products/shoe-1.jpg",
        "imgSrcHover": "./assets/images/products/shoe-1_1.jpg",
        "rating": 3
    },
    {
        "title": "Elegant Rose Gold Earrings",
        "category": "Jewelry",
        "price": 25.00,
        "oldPrice": 35.00,
        "badge": "20%",
        "imgSrcDefault": "./assets/images/products/jewellery-1.jpg",
        "imgSrcHover": "./assets/images/products/jewellery-2.jpg",
        "rating": 5
    }
]

def format_firestore_fields(product):
    """Converts a standard Python dict into a Firestore REST document structure."""
    return {
        "fields": {
            "title": {"stringValue": product["title"]},
            "category": {"stringValue": product["category"]},
            "price": {"doubleValue": float(product["price"])},
            "oldPrice": {"doubleValue": float(product["oldPrice"])},
            "badge": {"stringValue": product["badge"]},
            "imgSrcDefault": {"stringValue": product["imgSrcDefault"]},
            "imgSrcHover": {"stringValue": product["imgSrcHover"]},
            "rating": {"integerValue": int(product["rating"])}
        }
    }

def parse_firestore_document(doc):
    """Converts a Firestore REST document back into a clean Python dictionary."""
    fields = doc.get("fields", {})
    name_path = doc.get("name", "")
    doc_id = name_path.split("/")[-1] if name_path else ""
    
    return {
        "id": doc_id,
        "title": fields.get("title", {}).get("stringValue", ""),
        "category": fields.get("category", {}).get("stringValue", ""),
        "price": float(fields.get("price", {}).get("doubleValue", fields.get("price", {}).get("integerValue", 0))),
        "oldPrice": float(fields.get("oldPrice", {}).get("doubleValue", fields.get("oldPrice", {}).get("integerValue", 0))),
        "badge": fields.get("badge", {}).get("stringValue", ""),
        "imgSrcDefault": fields.get("imgSrcDefault", {}).get("stringValue", ""),
        "imgSrcHover": fields.get("imgSrcHover", {}).get("stringValue", ""),
        "rating": int(fields.get("rating", {}).get("integerValue", 0))
    }

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "success",
        "message": "Mini Cart Python Backend is running successfully!",
        "database": f"Firebase Firestore ({PROJECT_ID})"
    })

@app.route("/api/products", methods=["GET"])
def get_products():
    try:
        # Fetch products from Firebase Firestore via REST API
        url = f"{FIRESTORE_URL}/products"
        response = requests.get(url)
        
        # If collection doesn't exist or is empty in Firestore, seed it
        if response.status_code == 404 or "documents" not in response.json():
            print("Firestore products collection is empty. Seeding defaults...")
            seeded_products = []
            for product in DEFAULT_PRODUCTS:
                firestore_doc = format_firestore_fields(product)
                post_resp = requests.post(url, json=firestore_doc)
                if post_resp.status_code == 200:
                    seeded_products.append(parse_firestore_document(post_resp.json()))
            return jsonify(seeded_products)
        
        # Parse and return the documents from Firestore
        data = response.json()
        documents = data.get("documents", [])
        parsed_products = [parse_firestore_document(doc) for doc in documents]
        return jsonify(parsed_products)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/orders", methods=["POST"])
def place_order():
    try:
        order_data = request.json
        if not order_data:
            return jsonify({"error": "No order data provided"}), 400
        
        # Structure the order for Firestore REST API
        firestore_order = {
            "fields": {
                "userId": {"stringValue": order_data.get("userId", "guest")},
                "total": {"doubleValue": float(order_data.get("total", 0))},
                "status": {"stringValue": "pending"}
            }
        }
        
        url = f"{FIRESTORE_URL}/orders"
        response = requests.post(url, json=firestore_order)
        
        if response.status_code == 200:
            doc_data = response.json()
            order_id = doc_data.get("name", "").split("/")[-1]
            return jsonify({
                "status": "success",
                "message": "Order placed successfully!",
                "orderId": order_id
            })
        else:
            return jsonify({"error": "Failed to save order to Firestore", "details": response.text}), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Render uses the PORT environment variable
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
