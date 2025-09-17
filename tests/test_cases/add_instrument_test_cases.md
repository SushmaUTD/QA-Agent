# Test Cases: Add New Instrument - Goldman Sachs Trading Platform

## Test Case 1: Successful Addition of Equity Instrument
**Test ID**: TC_ADD_001
**Priority**: High
**Type**: Functional

**Preconditions**:
- User has access to Goldman Sachs trading platform
- Application is loaded and responsive
- "Add Instrument" button is visible

**Test Steps**:
1. Navigate to https://v0-product-crud-app.vercel.app/
2. Click on "Add Instrument" button (blue button in top right)
3. Fill in the form with valid equity data:
   - Symbol: "MSFT"
   - Name: "Microsoft Corporation"
   - Asset Class: "Equity"
   - Price: "415.50"
   - Volume: "25.3M"
   - Market Cap: "$3.1T"
4. Click "Save" or "Add" button
5. Verify the form closes/modal dismisses
6. Check that MSFT appears in the instruments table
7. Verify all data fields are correctly displayed

**Expected Results**:
- Form opens successfully
- All fields accept valid input
- New instrument appears in the table with correct data
- Total Instruments count increases by 1

---

## Test Case 2: Add Cryptocurrency Instrument
**Test ID**: TC_ADD_002
**Priority**: Medium
**Type**: Functional

**Test Steps**:
1. Click "Add Instrument" button
2. Enter cryptocurrency data:
   - Symbol: "BTC"
   - Name: "Bitcoin"
   - Asset Class: "Cryptocurrency"
   - Price: "67,500.00"
   - Volume: "15.2B"
   - Market Cap: "$1.3T"
3. Submit the form
4. Verify Bitcoin appears in the instruments list

**Expected Results**:
- Cryptocurrency instrument is successfully added
- Price formatting handles large numbers correctly

---

## Test Case 3: Add Fixed Income Instrument
**Test ID**: TC_ADD_003
**Priority**: Medium
**Type**: Functional

**Test Steps**:
1. Click "Add Instrument" button
2. Enter fixed income data:
   - Symbol: "US30Y"
   - Name: "30-Year Treasury Bond"
   - Asset Class: "Fixed Income"
   - Price: "4.875"
   - Volume: "892.5M"
   - Market Cap: "N/A"
3. Submit the form

**Expected Results**:
- Fixed income instrument added successfully
- Handles "N/A" values appropriately

---

## Test Case 4: Form Validation - Empty Required Fields
**Test ID**: TC_ADD_004
**Priority**: High
**Type**: Negative

**Test Steps**:
1. Click "Add Instrument" button
2. Leave all fields empty
3. Attempt to submit the form

**Expected Results**:
- Form validation prevents submission
- Error messages displayed for required fields
- Form remains open for correction

---

## Test Case 5: Form Validation - Invalid Data Types
**Test ID**: TC_ADD_005
**Priority**: High
**Type**: Negative

**Test Steps**:
1. Click "Add Instrument" button
2. Enter invalid data:
   - Symbol: "123!@#" (special characters)
   - Name: "" (empty)
   - Price: "abc" (non-numeric)
   - Volume: "-100" (negative number)
3. Attempt to submit

**Expected Results**:
- Validation errors for each invalid field
- Form does not submit
- Clear error messaging

---

## Test Case 6: Duplicate Symbol Prevention
**Test ID**: TC_ADD_006
**Priority**: High
**Type**: Negative

**Test Steps**:
1. Click "Add Instrument" button
2. Enter data with existing symbol (e.g., "AAPL")
3. Submit the form

**Expected Results**:
- System prevents duplicate symbol entry
- Error message: "Symbol already exists"
- Form remains open for correction

---

## Test Case 7: UI Responsiveness During Add Operation
**Test ID**: TC_ADD_007
**Priority**: Medium
**Type**: UI

**Test Steps**:
1. Click "Add Instrument" button
2. Verify modal/form opens smoothly
3. Fill form and submit
4. Observe loading states and transitions
5. Verify table updates without page refresh

**Expected Results**:
- Smooth animations and transitions
- Loading indicators where appropriate
- Real-time table updates

---

## Test Case 8: Cancel Add Operation
**Test ID**: TC_ADD_008
**Priority**: Medium
**Type**: Functional

**Test Steps**:
1. Click "Add Instrument" button
2. Fill in some form data
3. Click "Cancel" or close button
4. Verify no data is saved

**Expected Results**:
- Form closes without saving
- No new instrument added to table
- Total count remains unchanged

---

## Test Case 9: Large Dataset Performance
**Test ID**: TC_ADD_009
**Priority**: Low
**Type**: Performance

**Test Steps**:
1. Add multiple instruments (10+) in succession
2. Monitor page performance
3. Verify table rendering and search functionality

**Expected Results**:
- Page remains responsive
- Table pagination/virtualization works
- Search and filters function correctly

---

## Test Case 10: Cross-Browser Compatibility
**Test ID**: TC_ADD_010
**Priority**: Medium
**Type**: Compatibility

**Test Steps**:
1. Test add instrument functionality in:
   - Chrome
   - Firefox
   - Safari
   - Edge
2. Verify consistent behavior across browsers

**Expected Results**:
- Consistent functionality across all browsers
- UI renders correctly on different browsers
