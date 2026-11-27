const fs = require('fs');

const COLUMNS = {
    name: ['product_name', 'name', 'item', 'product', 'title'],
    category: ['category', 'product_category', 'department', 'type'],
    price: ['price','selling_price', 'sale_price', 'unit_price', 'discounted_price'],
    mrp: ['mrp', 'list_price', 'actual_price', 'original_price'],
    unit: ['unit', 'size', 'quantity', 'weight', 'pack_size'],
    image: ['image', 'image_url', 'img_link', 'img']
};

// ---Tiny CSV Parser (handles quotes, commas inside quotes, CRLF) ---
function parseCSV(text) {
    const rows = []; let row = [], cell = '',q = false;
    for(let i = 0; i < text.length; i++) {
        const c = text[i];
        if (q) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') q = false;
            else cell += c;
        } else if (c === '"') q = true;
        else if (c === ',') { row.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(cell); cell = '';
            if (row.some((v) => v !== '')) rows.push(row);
            row = [];
        } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
}

const pick = (obj, keys) => {
    for (const k of keys) if (obj[k] !== undefined && obj[k] !== '') return obj[k];
    return '';
};
const num = (v) => parseFloat(String(v).replace(/[^0-9.]/g,'')) || 0;

const file = process.argv[2];
if (!file) { console.error('Usage: node convert.js "Indian FMCG Retail Sales Customer Inventory(2024).csv"'); process.exit(1); }

const [header, ...rows] = parseCSV(fs.readFileSync(file, 'utf8').replace(/^/,''));
const keys = header.map((h) => h.trim().toLowerCase().replace(/\s+/g,'_'));

const products = rows
    .map((r, i) => {
        const o = {};
        keys.forEach((k, j) => {
            o[k] = (r[j] || '').trim();
        });
        const price = num(pick(o, COLUMNS.price));
        const mrp = num(pick(o, COLUMNS.mrp)) || price;
        return {
            id: i + 1,
            name: pick(o, COLUMNS.name),
            category: pick(o, COLUMNS.category) || 'Other',
            unit: pick(o, COLUMNS.unit),
            price,
            mrp: Math.max(mrp, price),
            image: pick(o, COLUMNS.image)
        };
    })
    .filter((p) => p.name && p.price > 0);

fs.writeFileSync('products.json', JSON.stringify(products));
console.log(`Wrote products.json with ${products.length} products from ${rows.length} rows.`);
console.log('Columns found in your CSV:', keys.join(', '));

