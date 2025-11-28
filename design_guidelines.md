# Prime Care Clinic Management System - Design Guidelines

## Design Approach

**Selected System: Material Design 3** - Medical applications demand clarity, established patterns, and minimal learning curve. Material Design provides robust form components, data tables, and card systems essential for healthcare workflows.

**Key Design Principles:**
- **Clinical Efficiency**: Minimal clicks to complete tasks
- **Data Clarity**: Clear visual hierarchy for medical information
- **Error Prevention**: Obvious validation and confirmation patterns
- **Professional Trust**: Clean, medical-grade aesthetic

---

## Typography

**Font Family:** Inter (Google Fonts)
- **Headings (H1-H2):** 600 weight, 28px-36px
- **Section Headers (H3-H4):** 500 weight, 20px-24px  
- **Body Text:** 400 weight, 16px
- **Labels/Metadata:** 500 weight, 14px
- **Small Text:** 400 weight, 13px

---

## Layout System

**Spacing Units:** Consistent use of Tailwind's 4, 6, 8, 12, 16 for all spacing
- **Container padding:** p-6 or p-8
- **Card spacing:** p-6 internally, mb-4 between cards
- **Form gaps:** gap-6 for form sections, gap-4 for field groups
- **Section margins:** mb-8 between major sections

**Grid System:**
- **Dashboard:** 3-column stat cards (grid-cols-3), single-column patient list below
- **Forms:** 2-column layout for input fields (grid-cols-2), full-width for text areas
- **Billing:** Single column for patient selection, 2-column for treatment/medicine entry

---

## Component Library

### Navigation
**Horizontal Navbar:** Fixed top navigation with clinic logo left, menu items centered/right
- **Menu Items:** Dashboard | New Registration | Medicine/Billing | Medicine Master | Treatment Master | Reports | Expense Master
- **Active State:** Underline with 3px accent indicator
- **Height:** h-16 with shadow-sm

### Dashboard Components

**Stats Cards:** 3-card row displaying key metrics
- Today's Patients | Pending Payments | Total Revenue
- Large number (32px, 700 weight), small label below
- Icon on the right side of each card

**Patient List Table:**
- Columns: Patient Name | Phone | Last Visit | Status Badge | Actions
- Row hover state with subtle background change
- Clickable rows to view full patient history
- Search bar above table (top-right)

### Forms (New Registration & Follow-up)

**Input Fields:**
- Full-width labels above inputs (14px, 500 weight)
- Input height: h-12 with rounded-lg borders
- Required field indicators with red asterisk
- Date picker with calendar icon
- Complaints & Diagnosis as textarea (h-24)

**Follow-up Visit Form:**
- Collapsible "Add New Visit" section in patient detail view
- Same field structure but labeled "Follow-up - [Date]"

### Medicine/Billing Workflow

**Patient Selection:**
- Searchable dropdown list with patient name + phone preview
- Upon selection, show patient card with: Name, Phone, Registration Date, Last Visit

**Treatment Entry:**
- Table with columns: Treatment Name (dropdown from master) | Amount (editable) | Remove
- "Add Treatment" button below table

**Medicine Entry:**
- Repeatable rows: Medicine Name (searchable dropdown) | Quantity | Price (editable) | Amount | Remove
- Prominent "+ Add Medicine" button
- Auto-calculate total after each entry

**Payment Section:**
- Large total amount display (24px, 700 weight)
- Amount Paid input field
- Pending Amount calculation (bold red if > 0)
- "Generate Bill" primary button

### Bills View

**All Bills Table:**
- Columns: Bill# | Patient Name | Date | Total Amount | Paid | Pending | Status Badge | Actions
- Status badges: "Paid" (green) | "Pending" (yellow/orange)
- Click row to view bill details
- "Settle Payment" action button for pending bills

### Medicine Master

**Medicine Inventory Table:**
- Columns: Medicine Name | Price | Stock Qty | Earnings | Actions (Edit/Delete)
- "Add Medicine" button (top-right)
- Stock quantity with low-stock warning (< 10 units in orange/red)

**Add/Edit Medicine Modal:**
- Fields: Medicine Name | Unit Price | Initial Quantity
- Save/Cancel buttons

### Treatment Master

**Treatment List:**
- Simple table: Treatment Name | Default Price | Actions
- Inline editing capability
- "+ Add Treatment" button

### Reports Section

**Monthly Earnings Card:**
- Month selector dropdown
- Large revenue number with breakdown: Services | Medicines | Total
- Simple bar chart visualization (optional but recommended)

**Expense Master:**
- Table: Date | Expense Type | Description | Amount | Actions
- Running total at bottom
- "Add Expense" button

**Profit Summary:**
- Card showing: Total Earnings - Total Expenses = Net Profit
- Month-over-month comparison indicator

---

## Key Interactions

**Modal Overlays:** Use for Add/Edit operations (Medicine, Treatment, Expense)
- Centered, max-w-md with backdrop blur
- Clear "X" close button top-right

**Confirmation Dialogs:** For delete operations and bill generation
- Simple centered dialog with message and Yes/Cancel buttons

**Toast Notifications:** For success/error feedback
- Top-right position, auto-dismiss after 3 seconds
- Green for success, red for errors

**Loading States:** Skeleton screens for data tables during fetch

---

## No Images Required

This is a data-driven medical application. No hero images or decorative photography needed. Focus on clean data presentation and functional UI elements.