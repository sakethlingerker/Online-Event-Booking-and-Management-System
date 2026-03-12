const mysql = require('mysql2/promise');

async function addPremiumEvents() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'saketh123',
            database: 'online_events'
        });

        // Get organizer ID
        const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', ['organizer@example.com']);
        const organizerId = users[0].id;

        const events = [
            {
                title: 'Global AI Summit 2025',
                description: 'Join world-class experts for a deep dive into the future of Artificial Intelligence. Keynotes from industry leaders, hands-on workshops, and networking sessions on generative AI, robotics, and ethics.',
                date: '2025-09-20 09:00:00',
                location: 'Silicon Valley Convention Center, CA',
                price: 499.00,
                total_seats: 1000,
                image_url: '/images/events/ai_summit.png'
            },
            {
                title: 'Neon Nights Music Festival',
                description: 'Experience an unforgettable night of electronic music and digital art. Featuring top DJs, immersive light installations, and a vibrant community atmosphere.',
                date: '2025-07-15 19:00:00',
                location: 'Brooklyn Warehouse, NY',
                price: 85.00,
                total_seats: 2500,
                image_url: '/images/events/neon_music.png'
            },
            {
                title: 'Gourmet Food & Wine Expo',
                description: 'A celebration of culinary excellence. Taste exquisite dishes from Michelin-starred chefs and samples from the world\'s finest wineries.',
                date: '2025-10-05 11:00:00',
                location: 'Downtown Exhibition Hall, Chicago',
                price: 120.00,
                total_seats: 500,
                image_url: '/images/events/food_expo.png'
            },
            {
                title: 'Startup Pitch Night',
                description: 'Where the next big thing begins. Watch 10 promising startups pitch to leading VCs. Networking mixer with investors, founders, and talented developers.',
                date: '2025-06-12 18:30:00',
                location: 'Tech Hub Co-working, Austin',
                price: 25.00,
                total_seats: 150,
                image_url: '/images/events/pitch_night.png'
            },
            {
                title: 'Cosmic Stargazing Retreat',
                description: 'Escape the city lights and reconnect with the universe. Professional-guided telescope sessions, astrophotography workshops, and nighttime storytelling under the stars.',
                date: '2025-08-22 21:00:00',
                location: 'Dark Sky Reserve, Jasper Park',
                price: 150.00,
                total_seats: 60,
                image_url: '/images/events/stargazing.png'
            }
        ];

        console.log('📥 Inserting premium events...');
        for (const event of events) {
            await connection.execute(
                'INSERT INTO events (title, description, date, location, price, total_seats, available_seats, organizer_id, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "approved")',
                [event.title, event.description, event.date, event.location, event.price, event.total_seats, event.total_seats, organizerId, event.image_url]
            );
            console.log(`✅ Added: ${event.title}`);
        }

        console.log('\n🎉 All premium events added successfully!');
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addPremiumEvents();
