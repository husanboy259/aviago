/**
 * DeliDrone seed script — populates dev database with sample data.
 * Run: npx ts-node scripts/seed.ts
 */

import axios from 'axios';

const API = 'http://localhost:3000/api/v1';

async function getAdminToken(): Promise<string> {
  // Send OTP (dev mode prints code to console)
  await axios.post(`${API}/auth/otp/send`, { phone: '+998901234567' });
  console.log('Check auth-service console for OTP code, then enter it:');

  // For automation, use the dev OTP code "123456" if NODE_ENV=development
  const { data } = await axios.post(`${API}/auth/otp/verify`, { phone: '+998901234567', code: '123456' });
  return data.accessToken;
}

async function seed() {
  console.log('🌱 Seeding DeliDrone database…\n');

  let token: string;
  try {
    token = await getAdminToken();
    console.log('✅ Auth token obtained\n');
  } catch (e: any) {
    console.error('❌ Auth failed:', e.response?.data || e.message);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Seed restaurants
  const restaurants = [
    {
      name: 'Tandoor House',
      description: 'Authentic Uzbek cuisine with a modern twist',
      address: 'Yunusabad, Tashkent',
      latitude: 41.2995, longitude: 69.2401,
      phone: '+998712345678',
      categories: ['Uzbek', 'Grill'],
      deliveryFee: 15000,
      estimatedDeliveryMinutes: 20,
      minOrderAmount: 50000,
    },
    {
      name: 'Sushi Master',
      description: 'Fresh Japanese sushi and rolls',
      address: 'Chilonzor, Tashkent',
      latitude: 41.3111, longitude: 69.2797,
      phone: '+998712345679',
      categories: ['Japanese', 'Sushi'],
      deliveryFee: 20000,
      estimatedDeliveryMinutes: 25,
      minOrderAmount: 80000,
    },
    {
      name: 'Plov Republic',
      description: "The finest plov in all of Tashkent",
      address: 'Mirzo Ulugbek, Tashkent',
      latitude: 41.2765, longitude: 69.2003,
      phone: '+998712345680',
      categories: ['Uzbek', 'Rice'],
      deliveryFee: 12000,
      estimatedDeliveryMinutes: 15,
      minOrderAmount: 40000,
    },
  ];

  for (const r of restaurants) {
    try {
      const { data } = await axios.post(`${API}/restaurants`, r, { headers });
      console.log(`✅ Restaurant: ${data.name}`);
    } catch (e: any) {
      console.error(`❌ Restaurant failed: ${e.response?.data?.message}`);
    }
  }

  // Seed drones
  const drones = [
    { serialNumber: 'DD-2024-001', model: 'DJI Matrice 300',   maxPayloadGrams: 2700, maxRangeKm: 15 },
    { serialNumber: 'DD-2024-002', model: 'DJI Matrice 300',   maxPayloadGrams: 2700, maxRangeKm: 15 },
    { serialNumber: 'DD-2024-003', model: 'Autel EVO II',      maxPayloadGrams: 800,  maxRangeKm: 9  },
    { serialNumber: 'DD-2024-004', model: 'Skydio X2D',        maxPayloadGrams: 1000, maxRangeKm: 10 },
    { serialNumber: 'DD-2024-005', model: 'DJI Agras T40',     maxPayloadGrams: 5000, maxRangeKm: 7  },
  ];

  for (const d of drones) {
    try {
      const { data } = await axios.post(`${API}/drones`, d, { headers });
      console.log(`✅ Drone: ${data.serialNumber}`);
    } catch (e: any) {
      console.error(`❌ Drone failed: ${e.response?.data?.message}`);
    }
  }

  console.log('\n🎉 Seed complete!');
}

seed().catch(console.error);
