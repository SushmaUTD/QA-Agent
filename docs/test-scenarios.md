# Test Scenarios for JIRA Stories

## PROJ-101: View Project List

### Test Scenarios
1. **Happy Path - Load Projects Successfully**
   - Given the API returns a list of projects
   - When the page loads
   - Then all projects should be displayed in the table
   - And the project count should be accurate

2. **Empty State**
   - Given there are no projects in the system
   - When the page loads
   - Then an empty state message should be displayed
   - And the message should encourage adding the first project

3. **Loading State**
   - Given the API is slow to respond
   - When the page loads
   - Then a loading spinner should be displayed
   - And the table should not show stale data

4. **Error State**
   - Given the API returns an error
   - When the page loads
   - Then an error toast should be displayed
   - And the user should be able to retry

## PROJ-102: Search and Filter Projects

### Test Scenarios
1. **Search by Name**
   - Given there are projects with different names
   - When I type "E-commerce" in the search box
   - Then only projects with "E-commerce" in the name should be displayed

2. **Search by Description**
   - Given there are projects with different descriptions
   - When I type "React" in the search box
   - Then only projects with "React" in the description should be displayed

3. **Filter by Status**
   - Given there are projects with different statuses
   - When I select "Active" from the status filter
   - Then only active projects should be displayed

4. **Combined Search and Filter**
   - Given there are multiple projects
   - When I search for "App" and filter by "High" priority
   - Then only high-priority projects containing "App" should be displayed

## PROJ-103: Create New Project

### Test Scenarios
1. **Successful Project Creation**
   - Given I fill out all required fields correctly
   - When I click "Add Project"
   - Then the project should be created
   - And a success toast should appear
   - And the project should appear in the list

2. **Validation Error - Empty Name**
   - Given I leave the name field empty
   - When I try to submit the form
   - Then a validation error should appear
   - And the form should not submit

3. **Validation Error - Short Description**
   - Given I enter a description with less than 10 characters
   - When I move to another field
   - Then a validation error should appear

4. **Validation Error - Invalid Date Range**
   - Given I set the end date before the start date
   - When I try to submit the form
   - Then a validation error should appear

## PROJ-104: Edit Existing Project

### Test Scenarios
1. **Successful Project Update**
   - Given I edit a project with valid data
   - When I click "Update Project"
   - Then the project should be updated
   - And the changes should be reflected in the list

2. **Form Pre-population**
   - Given I click the edit button for a project
   - When the edit dialog opens
   - Then all fields should be pre-populated with current values

3. **Cancel Edit**
   - Given I make changes to a project
   - When I click "Cancel"
   - Then the changes should be discarded
   - And the dialog should close

## PROJ-105: Delete Project

### Test Scenarios
1. **Successful Project Deletion**
   - Given I click the delete button for a project
   - When I confirm the deletion
   - Then the project should be removed from the list
   - And a success toast should appear

2. **Cancel Deletion**
   - Given I click the delete button for a project
   - When I click "Cancel" in the confirmation dialog
   - Then the project should not be deleted
   - And the dialog should close

3. **Delete Confirmation Shows Project Name**
   - Given I click the delete button for "E-commerce Platform"
   - When the confirmation dialog appears
   - Then it should show "E-commerce Platform" in the message

## PROJ-106: Form Validation and Error Handling

### Test Scenarios
1. **Real-time Validation**
   - Given I start typing in the name field
   - When I enter less than 3 characters
   - Then a validation error should appear immediately

2. **Required Field Indicators**
   - Given I open the add project form
   - When the form loads
   - Then required fields should be marked with asterisks

3. **Network Error Handling**
   - Given the API is unavailable
   - When I try to create a project
   - Then an error toast should appear
   - And I should be able to retry

## PROJ-107: Responsive Design and Mobile Support

### Test Scenarios
1. **Mobile Table Display**
   - Given I'm on a mobile device
   - When I view the project list
   - Then the table should be scrollable horizontally
   - And all data should be readable

2. **Mobile Form Interaction**
   - Given I'm on a mobile device
   - When I open the add project form
   - Then all form fields should be easily tappable
   - And the keyboard should appear appropriately

## PROJ-108: API Error Handling and Loading States

### Test Scenarios
1. **Loading State During Creation**
   - Given I submit a new project form
   - When the API call is in progress
   - Then the submit button should show a loading spinner
   - And the button should be disabled

2. **Error Recovery**
   - Given an API call fails
   - When I see the error message
   - Then I should be able to retry the operation
   - And the error should clear on success

## PROJ-109: API Endpoints Implementation

### Test Scenarios
1. **GET /api/projects Returns All Projects**
   - Given there are projects in the system
   - When I call GET /api/projects
   - Then all projects should be returned
   - And the response should have success: true

2. **POST /api/projects Creates New Project**
   - Given I send valid project data
   - When I call POST /api/projects
   - Then a new project should be created
   - And the response should include the new project with ID

3. **PUT /api/projects/:id Updates Project**
   - Given I send updated project data
   - When I call PUT /api/projects/1
   - Then the project should be updated
   - And the response should include the updated project

4. **DELETE /api/projects/:id Removes Project**
   - Given a project exists with ID 1
   - When I call DELETE /api/projects/1
   - Then the project should be removed
   - And subsequent GET requests should not include it

## PROJ-110: Data Validation Layer

### Test Scenarios
1. **Server-side Validation Matches Client-side**
   - Given I bypass client-side validation
   - When I send invalid data to the API
   - Then the server should return validation errors
   - And the errors should match client-side rules

2. **Validation Error Response Format**
   - Given I send invalid data
   - When the server validates the request
   - Then errors should be returned in a consistent format
   - And each error should specify the field and message
