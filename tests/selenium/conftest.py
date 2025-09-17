"""
Pytest configuration file for Selenium tests
"""

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture(scope="session")
def driver_init():
    """Initialize WebDriver for the test session"""
    
    # Chrome options for better test stability
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Uncomment for headless mode
    # chrome_options.add_argument("--headless")
    
    # Auto-download and setup ChromeDriver
    service = Service(ChromeDriverManager().install())
    
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.maximize_window()
    
    yield driver
    
    driver.quit()

@pytest.fixture
def base_url():
    """Base URL for the application"""
    return "https://v0-product-crud-app.vercel.app/"
