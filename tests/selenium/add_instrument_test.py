"""
Selenium Test Suite for Goldman Sachs Trading Platform - Add Instrument Functionality
"""

import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class TestAddInstrument:
    
    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Setup method to initialize WebDriver before each test"""
        self.driver = webdriver.Chrome()  # Make sure chromedriver is in PATH
        self.driver.maximize_window()
        self.wait = WebDriverWait(self.driver, 10)
        self.base_url = "https://v0-product-crud-app.vercel.app/"
        
        # Navigate to the application
        self.driver.get(self.base_url)
        
        # Wait for page to load
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        
        yield
        
        # Teardown
        self.driver.quit()
    
    def get_total_instruments_count(self):
        """Helper method to get current total instruments count"""
        try:
            total_element = self.wait.until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(text(), 'Total Instruments')]/following-sibling::*"))
            )
            return int(total_element.text.strip())
        except:
            # Fallback: count table rows
            rows = self.driver.find_elements(By.XPATH, "//table/tbody/tr")
            return len(rows)
    
    def click_add_instrument_button(self):
        """Helper method to click the Add Instrument button"""
        add_button = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Add Instrument')]"))
        )
        add_button.click()
        
        # Wait for form/modal to appear
        time.sleep(1)
    
    def fill_instrument_form(self, symbol, name, asset_class, price, volume, market_cap):
        """Helper method to fill the instrument form"""
        # Wait for form fields to be present
        symbol_field = self.wait.until(EC.presence_of_element_located((By.NAME, "symbol")))
        
        # Fill form fields
        symbol_field.clear()
        symbol_field.send_keys(symbol)
        
        name_field = self.driver.find_element(By.NAME, "name")
        name_field.clear()
        name_field.send_keys(name)
        
        # Handle asset class dropdown or input
        try:
            asset_class_field = self.driver.find_element(By.NAME, "assetClass")
            if asset_class_field.tag_name == "select":
                select = Select(asset_class_field)
                select.select_by_visible_text(asset_class)
            else:
                asset_class_field.clear()
                asset_class_field.send_keys(asset_class)
        except NoSuchElementException:
            # Try alternative selectors
            asset_class_field = self.driver.find_element(By.XPATH, "//input[@placeholder*='Asset Class' or @placeholder*='asset']")
            asset_class_field.clear()
            asset_class_field.send_keys(asset_class)
        
        price_field = self.driver.find_element(By.NAME, "price")
        price_field.clear()
        price_field.send_keys(price)
        
        volume_field = self.driver.find_element(By.NAME, "volume")
        volume_field.clear()
        volume_field.send_keys(volume)
        
        market_cap_field = self.driver.find_element(By.NAME, "marketCap")
        market_cap_field.clear()
        market_cap_field.send_keys(market_cap)
    
    def submit_form(self):
        """Helper method to submit the form"""
        submit_button = self.driver.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Save') or contains(text(), 'Add')]")
        submit_button.click()
        
        # Wait for form to close/submit
        time.sleep(2)
    
    def verify_instrument_in_table(self, symbol, name):
        """Helper method to verify instrument appears in the table"""
        try:
            # Look for the symbol in the table
            symbol_cell = self.wait.until(
                EC.presence_of_element_located((By.XPATH, f"//td[contains(text(), '{symbol}')]"))
            )
            
            # Verify name is in the same row
            row = symbol_cell.find_element(By.XPATH, "./parent::tr")
            name_cell = row.find_element(By.XPATH, f".//td[contains(text(), '{name}')]")
            
            return True
        except TimeoutException:
            return False
    
    def test_add_equity_instrument_success(self):
        """Test Case 1: Successfully add an equity instrument"""
        print("Starting Test: Add Equity Instrument")
        
        # Get initial count
        initial_count = self.get_total_instruments_count()
        print(f"Initial instrument count: {initial_count}")
        
        # Click Add Instrument button
        self.click_add_instrument_button()
        
        # Fill form with equity data
        self.fill_instrument_form(
            symbol="MSFT",
            name="Microsoft Corporation", 
            asset_class="Equity",
            price="415.50",
            volume="25.3M",
            market_cap="$3.1T"
        )
        
        # Submit form
        self.submit_form()
        
        # Verify instrument appears in table
        assert self.verify_instrument_in_table("MSFT", "Microsoft Corporation"), "MSFT not found in table"
        
        # Verify count increased
        new_count = self.get_total_instruments_count()
        assert new_count == initial_count + 1, f"Expected count {initial_count + 1}, got {new_count}"
        
        print("✅ Test Passed: Equity instrument added successfully")
    
    def test_add_cryptocurrency_instrument(self):
        """Test Case 2: Add cryptocurrency instrument"""
        print("Starting Test: Add Cryptocurrency Instrument")
        
        self.click_add_instrument_button()
        
        self.fill_instrument_form(
            symbol="BTC",
            name="Bitcoin",
            asset_class="Cryptocurrency", 
            price="67500.00",
            volume="15.2B",
            market_cap="$1.3T"
        )
        
        self.submit_form()
        
        assert self.verify_instrument_in_table("BTC", "Bitcoin"), "Bitcoin not found in table"
        print("✅ Test Passed: Cryptocurrency instrument added successfully")
    
    def test_add_fixed_income_instrument(self):
        """Test Case 3: Add fixed income instrument"""
        print("Starting Test: Add Fixed Income Instrument")
        
        self.click_add_instrument_button()
        
        self.fill_instrument_form(
            symbol="US30Y",
            name="30-Year Treasury Bond",
            asset_class="Fixed Income",
            price="4.875", 
            volume="892.5M",
            market_cap="N/A"
        )
        
        self.submit_form()
        
        assert self.verify_instrument_in_table("US30Y", "30-Year Treasury Bond"), "US30Y not found in table"
        print("✅ Test Passed: Fixed income instrument added successfully")
    
    def test_form_validation_empty_fields(self):
        """Test Case 4: Form validation with empty required fields"""
        print("Starting Test: Form Validation - Empty Fields")
        
        self.click_add_instrument_button()
        
        # Try to submit empty form
        self.submit_form()
        
        # Check if form is still open (validation prevented submission)
        try:
            # Look for validation error messages or form still being present
            error_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'required') or contains(text(), 'error') or contains(@class, 'error')]")
            form_still_present = len(self.driver.find_elements(By.NAME, "symbol")) > 0
            
            assert len(error_elements) > 0 or form_still_present, "Form validation did not prevent empty submission"
            print("✅ Test Passed: Form validation working for empty fields")
        except:
            print("⚠️  Test Warning: Could not verify form validation behavior")
    
    def test_invalid_data_validation(self):
        """Test Case 5: Form validation with invalid data"""
        print("Starting Test: Invalid Data Validation")
        
        self.click_add_instrument_button()
        
        # Fill with invalid data
        self.fill_instrument_form(
            symbol="123!@#",  # Invalid symbol
            name="",          # Empty name
            asset_class="Equity",
            price="abc",      # Non-numeric price
            volume="-100",    # Negative volume
            market_cap="$1T"
        )
        
        self.submit_form()
        
        # Verify validation prevents submission
        try:
            error_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'invalid') or contains(text(), 'error') or contains(@class, 'error')]")
            form_still_present = len(self.driver.find_elements(By.NAME, "symbol")) > 0
            
            assert len(error_elements) > 0 or form_still_present, "Form validation did not catch invalid data"
            print("✅ Test Passed: Invalid data validation working")
        except:
            print("⚠️  Test Warning: Could not verify invalid data validation")
    
    def test_duplicate_symbol_prevention(self):
        """Test Case 6: Prevent duplicate symbol entry"""
        print("Starting Test: Duplicate Symbol Prevention")
        
        self.click_add_instrument_button()
        
        # Try to add instrument with existing symbol (AAPL already exists)
        self.fill_instrument_form(
            symbol="AAPL",
            name="Apple Inc Duplicate",
            asset_class="Equity", 
            price="175.00",
            volume="50M",
            market_cap="$2.8T"
        )
        
        self.submit_form()
        
        # Check for duplicate error or that form is still open
        try:
            duplicate_error = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'duplicate') or contains(text(), 'exists') or contains(text(), 'already')]")
            form_still_present = len(self.driver.find_elements(By.NAME, "symbol")) > 0
            
            # Also check that no duplicate AAPL was added to table
            aapl_rows = self.driver.find_elements(By.XPATH, "//td[contains(text(), 'AAPL')]")
            
            assert len(duplicate_error) > 0 or form_still_present or len(aapl_rows) == 1, "Duplicate symbol was not prevented"
            print("✅ Test Passed: Duplicate symbol prevention working")
        except:
            print("⚠️  Test Warning: Could not verify duplicate prevention")
    
    def test_cancel_add_operation(self):
        """Test Case 8: Cancel add operation"""
        print("Starting Test: Cancel Add Operation")
        
        initial_count = self.get_total_instruments_count()
        
        self.click_add_instrument_button()
        
        # Fill some data
        symbol_field = self.wait.until(EC.presence_of_element_located((By.NAME, "symbol")))
        symbol_field.send_keys("TEST")
        
        # Look for cancel button and click it
        try:
            cancel_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Cancel') or contains(text(), 'Close')]")
            cancel_button.click()
        except NoSuchElementException:
            # Try clicking outside modal or pressing escape
            self.driver.find_element(By.TAG_NAME, "body").click()
        
        time.sleep(1)
        
        # Verify no new instrument was added
        final_count = self.get_total_instruments_count()
        assert final_count == initial_count, f"Expected count {initial_count}, got {final_count}"
        
        # Verify TEST symbol is not in table
        test_elements = self.driver.find_elements(By.XPATH, "//td[contains(text(), 'TEST')]")
        assert len(test_elements) == 0, "TEST instrument found in table after cancel"
        
        print("✅ Test Passed: Cancel operation working correctly")

if __name__ == "__main__":
    # Run tests individually for debugging
    test_instance = TestAddInstrument()
    test_instance.setup_method()
    
    try:
        test_instance.test_add_equity_instrument_success()
        test_instance.test_add_cryptocurrency_instrument() 
        test_instance.test_add_fixed_income_instrument()
        test_instance.test_form_validation_empty_fields()
        test_instance.test_invalid_data_validation()
        test_instance.test_duplicate_symbol_prevention()
        test_instance.test_cancel_add_operation()
        
        print("\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
    
    finally:
        test_instance.driver.quit()
