/* eslint-disable no-console */
const env = require('../config/env');
const { connectDB } = require('../config/db');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Staff = require('../models/Staff');

const CATALOG = {
  Zudio: [
    ['Oversized Cotton Tee', 499, 5, 'M'], ['Slim Fit Jeans', 999, 12, '32'],
    ['Printed Shirt', 799, 5, 'L'], ['Cargo Joggers', 899, 12, 'M'],
    ['Crew Socks 3-Pack', 199, 5, 'Free'], ['Hooded Sweatshirt', 1099, 12, 'L'],
    ['Summer Dress', 899, 5, 'S'], ['Denim Jacket', 1499, 12, 'M'],
    ['Cap', 299, 5, 'Free'], ['Canvas Sneakers', 1299, 18, '8'],
  ],
  Nykaa: [
    ['Matte Lipstick', 599, 18, '4g'], ['Kajal Pencil', 249, 18, '1g'],
    ['Face Serum', 899, 18, '30ml'], ['Sunscreen SPF50', 649, 18, '50ml'],
    ['Micellar Water', 399, 18, '200ml'], ['Compact Powder', 549, 18, '10g'],
    ['Nail Polish', 199, 18, '9ml'], ['Hair Oil', 349, 18, '100ml'],
    ['Sheet Mask', 149, 18, '1pc'], ['Perfume Mist', 799, 18, '150ml'],
  ],
  Westside: [
    ['Linen Kurta', 1499, 5, 'M'], ['Formal Trousers', 1699, 12, '34'],
    ['Silk Scarf', 899, 5, 'Free'], ['Leather Belt', 1199, 18, '36'],
    ['Maxi Dress', 2199, 12, 'S'], ['Blazer', 3499, 12, 'L'],
    ['Cushion Cover', 699, 12, '16x16'], ['Ceramic Mug', 399, 18, '350ml'],
    ['Handbag', 2499, 18, 'Free'], ['Kids Romper', 799, 5, '2-3Y'],
  ],
  Max: [
    ['Polo T-Shirt', 699, 5, 'L'], ['Chino Shorts', 799, 12, '32'],
    ['Kids Tee', 399, 5, '5-6Y'], ['Sports Shoes', 1599, 18, '9'],
    ['Track Pants', 899, 12, 'M'], ['Night Suit', 999, 5, 'M'],
    ['Sandals', 799, 18, '7'], ['Jeggings', 899, 12, 'S'],
    ['Cotton Saree', 1799, 5, 'Free'], ['Backpack', 1299, 18, 'Free'],
  ],
  DMart: [
    ['Toor Dal 1kg', 149, 0, '1kg'], ['Basmati Rice 5kg', 549, 5, '5kg'],
    ['Sunflower Oil 1L', 139, 5, '1L'], ['Atta 10kg', 419, 0, '10kg'],
    ['Detergent Powder 2kg', 229, 18, '2kg'], ['Dish Wash Gel', 99, 18, '500ml'],
    ['Toothpaste', 89, 18, '150g'], ['Biscuits Pack', 45, 18, '200g'],
    ['Tea Powder 500g', 249, 5, '500g'], ['Shampoo 340ml', 289, 18, '340ml'],
  ],
  'Vishal Mega Mart': [
    ['Bath Towel', 349, 5, '70x140'], ['Bed Sheet Double', 799, 5, 'Double'],
    ['Steel Lunch Box', 449, 18, '3-tier'], ['Wall Clock', 599, 18, '10in'],
    ['Men Formal Shirt', 749, 5, 'L'], ['Women Leggings', 349, 5, 'M'],
    ['Kids School Bag', 899, 18, 'Free'], ['Plastic Chair', 999, 18, 'Free'],
    ['Floor Mop', 399, 18, 'Free'], ['Water Bottle 1L', 249, 18, '1L'],
  ],
};

const slug = (name) => name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();

async function run() {
  await connectDB(env.MONGO_URI);
  await Promise.all([Brand.deleteMany({}), Product.deleteMany({}), Staff.deleteMany({})]);

  let brandIndex = 0;
  for (const [brandName, items] of Object.entries(CATALOG)) {
    brandIndex += 1;
    const brand = await Brand.create({
      name: brandName,
      logo: `https://placehold.co/160x160?text=${encodeURIComponent(brandName)}`,
      isActive: true,
    });
    await Product.insertMany(
      items.map(([name, price, gstPercent, size], i) => ({
        brand: brand._id,
        barcode: `${slug(brandName)}${String(brandIndex)}${String(1000 + i)}`,
        name,
        price,
        gstPercent,
        size,
        image: `https://placehold.co/300x300?text=${encodeURIComponent(name)}`,
        stock: 50,
      }))
    );
    console.log(`Seeded ${brandName} with ${items.length} products`);
  }

  await Staff.create([
    { username: 'guard1', passwordHash: await Staff.hashPassword('guard@123'), role: 'guard' },
    { username: 'admin', passwordHash: await Staff.hashPassword('admin@123'), role: 'admin' },
  ]);

  console.log('\nStaff accounts: guard1 / guard@123  and  admin / admin@123');
  console.log('Sample barcodes:');
  const sample = await Product.find().limit(5).populate('brand', 'name');
  sample.forEach((p) => console.log(`  ${p.brand.name}: ${p.barcode} -> ${p.name}`));
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
