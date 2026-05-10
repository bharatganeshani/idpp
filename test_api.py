#!/usr/bin/env python
"""
Test script for AI Book Classification System
Tests both ML classifier and AI-powered classifier endpoints
"""

import json
import sys
from pathlib import Path

import requests

# Configuration
API_BASE_URL = "http://localhost:5000"
TIMEOUT = 30

# Sample book content for testing
SAMPLE_BOOKS = {
    "technology": {
        "title": "Artificial Intelligence Fundamentals",
        "content": """
        This comprehensive guide explores the core concepts of artificial intelligence,
        including machine learning algorithms, neural networks, natural language processing,
        and computer vision. The book covers both theoretical foundations and practical
        implementations using Python and TensorFlow. Topics include supervised and
        unsupervised learning, deep learning architectures, reinforcement learning,
        and ethical considerations in AI development.
        """
    },
    "fiction": {
        "title": "The Hidden Lighthouse",
        "content": """
        A gripping mystery novel set on a remote coastal island. When archaeologist
        Sarah discovers an abandoned lighthouse containing cryptic journals, she
        embarks on a journey to uncover decades-old secrets. As she delves deeper,
        she finds herself caught between supernatural occurrences and historical
        truths that powerful people want buried. With each clue, the danger escalates.
        """
    },
    "science": {
        "title": "Quantum Mechanics for Modern Science",
        "content": """
        An in-depth exploration of quantum mechanics principles including wave-particle
        duality, superposition, entanglement, and quantum tunneling. The book explains
        how quantum phenomena underpin modern technologies from semiconductors to
        quantum computers. It covers mathematical formalism and real-world applications
        in physics, chemistry, and emerging quantum technologies.
        """
    },
    "business": {
        "title": "Scaling Startups: From Idea to IPO",
        "content": """
        A practical guide for entrepreneurs and business leaders on scaling operations
        from startup to established company. Covers topics including team building,
        funding strategies, market expansion, technology infrastructure, company culture,
        and preparing for public markets. Includes case studies from successful tech
        companies and lessons from failed ventures.
        """
    }
}


def test_health_check():
    """Test the health endpoint"""
    print("\n" + "="*50)
    print("Testing: Health Check")
    print("="*50)
    
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✓ Health check passed")
            print(f"  Status: {data.get('status')}")
            print(f"  Model: {data.get('model')}")
            print(f"  Accuracy: {data.get('metrics', {}).get('accuracy', 'N/A')}")
            return True
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
    except requests.ConnectionError:
        print("✗ Cannot connect to API. Make sure the server is running:")
        print("  cd backend && python app.py")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_ml_classifier():
    """Test the ML classifier endpoint"""
    print("\n" + "="*50)
    print("Testing: ML Classifier (/predict)")
    print("="*50)
    
    try:
        payload = {
            "title": SAMPLE_BOOKS["technology"]["title"],
            "description": SAMPLE_BOOKS["technology"]["content"].strip()
        }
        
        response = requests.post(
            f"{API_BASE_URL}/predict",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✓ ML Classification successful")
            print(f"  Category: {data.get('category')}")
            print(f"  Confidence: {data.get('confidence', 'N/A')}")
            print(f"  Model: {data.get('model')}")
            return True
        else:
            print(f"✗ Classification failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_ai_classifier():
    """Test the AI classifier endpoint"""
    print("\n" + "="*50)
    print("Testing: AI Classifier (/classify)")
    print("="*50)
    print("Note: This requires API connection. It may take 5-10 seconds...")
    
    try:
        payload = {
            "title": SAMPLE_BOOKS["science"]["title"],
            "content": SAMPLE_BOOKS["science"]["content"].strip()
        }
        
        response = requests.post(
            f"{API_BASE_URL}/classify",
            json=payload,
            timeout=TIMEOUT
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                classification = data.get('classification', {})
                print("✓ AI Classification successful")
                print(f"  Primary Category: {classification.get('primary_category', 'N/A')}")
                print(f"  Summary: {classification.get('summary', 'N/A')[:100]}...")
                print(f"  Themes: {', '.join(classification.get('themes', [])[:3])}")
                print(f"  Content Type: {classification.get('content_type', 'N/A')}")
                print(f"  Confidence: {classification.get('confidence_score', 'N/A')}")
                print(f"  Model: {data.get('model')}")
                return True
            else:
                print(f"✗ API returned error: {data.get('error')}")
                return False
        else:
            print(f"✗ Classification failed: {response.status_code}")
            error_data = response.json()
            print(f"  Error: {error_data.get('error', 'Unknown error')}")
            return False
    except requests.Timeout:
        print("✗ Request timeout. API is taking too long to respond.")
        print("  The Nvidia API might be slow or unreachable.")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def test_file_upload():
    """Test file upload endpoint"""
    print("\n" + "="*50)
    print("Testing: File Upload (/upload-and-classify)")
    print("="*50)
    
    # Create a temporary test file
    test_file_path = Path("/tmp/test_book.txt")
    test_content = SAMPLE_BOOKS["fiction"]["content"]
    
    try:
        # Write test file
        test_file_path.write_text(test_content)
        
        # Upload file
        with open(test_file_path, "rb") as f:
            files = {"file": f}
            data = {"title": SAMPLE_BOOKS["fiction"]["title"]}
            
            response = requests.post(
                f"{API_BASE_URL}/upload-and-classify",
                files=files,
                data=data,
                timeout=TIMEOUT
            )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✓ File upload successful")
                print(f"  Filename: {result.get('filename')}")
                print(f"  Category: {result.get('classification', {}).get('primary_category', 'N/A')}")
                return True
            else:
                print(f"✗ Upload failed: {result.get('error')}")
                return False
        else:
            print(f"✗ Upload failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False
    finally:
        # Cleanup
        if test_file_path.exists():
            test_file_path.unlink()


def main():
    """Run all tests"""
    print("\n" + "="*50)
    print("AI Book Classification System - Test Suite")
    print("="*50)
    
    results = {
        "Health Check": test_health_check(),
        "ML Classifier": test_ml_classifier(),
        "AI Classifier": test_ai_classifier(),
        "File Upload": test_file_upload(),
    }
    
    # Summary
    print("\n" + "="*50)
    print("Test Summary")
    print("="*50)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! System is working correctly.")
        print("\nYou can now:")
        print("1. Open frontend/index.html in your browser")
        print("2. Use the demo interface to classify books")
        print("3. Try the ML Classifier or AI-Powered Classifier tabs")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed.")
        print("\nTroubleshooting:")
        print("- Make sure the Flask server is running: cd backend && python app.py")
        print("- Check your internet connection")
        print("- Verify API credentials in .env file")
        return 1


if __name__ == "__main__":
    sys.exit(main())
