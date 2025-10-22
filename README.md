# Order Transaction Matcher - Client-Side Web App

A React-based web application for matching orders with transactions using fuzzy matching algorithms. This client-side implementation allows users to input orders and transactions data manually or via CSV upload, then run a matching algorithm to find correlations.

## Features

- 📊 **Data Input**: Manual entry or CSV file upload for orders and transactions
- 🔍 **Fuzzy Matching**: Client-side algorithm using string similarity and date proximity
- 📈 **Results Visualization**: Clear display of matched and unmatched items
- 🎯 **Sample Data**: Built-in sample data for testing
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### 1. Data Input Tab
- **Manual Entry**: Fill out the form fields to add orders and transactions one by one
- **CSV Upload**: Click "Upload CSV" to import data from CSV files
- **Sample Data**: Click "Load Sample Data" to populate with example data

### 2. CSV Format

#### Orders CSV Format:
```csv
customer,orderId,date,item,priceCents
John Smith,ORD001,2024-01-15,Laptop,120000
Jane Doe,ORD002,2024-01-16,Mouse,2500
```

#### Transactions CSV Format:
```csv
customer,orderId,date,item,priceCents,txnType,txnAmountCents
John Smith,ORD001,2024-01-15,Laptop,120000,Purchase,120000
Jane Doe,ORD002,2024-01-16,Mouse,2500,Purchase,2500
```

### 3. Run Matching
- Switch to the "Run Matching" tab
- Click "Run Matching Algorithm" to process the data
- View results in the "Results" tab

### 4. View Results
- **Matched Items**: Orders successfully matched with transactions
- **Unmatched Orders**: Orders that couldn't be matched
- **Unmatched Transactions**: Transactions that couldn't be matched

## Matching Algorithm

The client-side matching algorithm uses several criteria:

1. **Customer Name Similarity**: Uses Levenshtein distance for fuzzy string matching
2. **Item Matching**: Case-insensitive exact matching
3. **Price Matching**: Exact price matching with fallback scoring
4. **Date Proximity**: Considers transactions within 60 days of order dates

Match scores are calculated with weighted criteria:
- Customer similarity: 40%
- Item matching: 30%
- Price matching: 20%
- Date proximity: 10%

Only matches with scores above 0.6 are considered valid.

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── DataInput.tsx      # Main data input interface
│   │   ├── OrderMatcher.tsx   # Results display component
│   │   ├── Dashboard.tsx      # Dashboard component
│   │   └── Header.tsx         # Header component
│   ├── utils/
│   │   └── matcher.ts         # Client-side matching algorithm
│   ├── types/
│   │   ├── domain.ts          # Business domain types
│   │   ├── components.ts      # Component prop types
│   │   └── api.ts            # API types
│   ├── App.tsx               # Main application component
│   └── main.tsx              # Application entry point
├── package.json
└── README.md
```

## Technologies Used

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **CSS3**: Modern styling with gradients and animations

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Adding New Features

1. **New Matching Criteria**: Modify the `calculateMatchScore` function in `utils/matcher.ts`
2. **UI Components**: Add new components in the `components/` directory
3. **Types**: Define new types in the `types/` directory

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
