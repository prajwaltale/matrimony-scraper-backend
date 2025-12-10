const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Get Bright Data credentials from environment
const BRIGHT_DATA_USERNAME = process.env.BRIGHT_DATA_USERNAME || 'brd-customer-prajwal';
const BRIGHT_DATA_PASSWORD = process.env.BRIGHT_DATA_PASSWORD || 'token123';

const scrapeMatrimonialProfile = async (url) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.get(url, {
      proxy: {
        protocol: 'http',
        host: 'auto.residential.serp.luminati.io',
        port: 24000,
        auth: {
          username: BRIGHT_DATA_USERNAME,
          password: BRIGHT_DATA_PASSWORD
        }
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
        'Accept-Language': 'en-US',
        'Referer': 'https://www.google.com/'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    const profile = {
      name: $('.profile-name, h1, .name-text').first().text().trim() || 'Profile',
      age: $('.profile-age, .age').first().text().trim() || 'N/A',
      city: $('.profile-city, .city').first().text().trim() || 'N/A',
      education: $('.profile-education, .education').first().text().trim() || 'N/A',
      bio: $('.profile-bio, .bio, .about').first().text().trim() || 'N/A',
      image: $('img[class*=profile], img[class*=avatar]').first().attr('src') || '',
      sourceUrl: url,
      scrapedAt: new Date().toISOString()
    };
    
    return profile;
    
  } catch (error) {
    console.error('Scrape error:', error.message);
    throw error;
  }
};

app.post('/api/scrape-profile', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  try {
    const profile = await scrapeMatrimonialProfile(url);
    res.json({
      success: true,
      data: profile,
      provider: 'Bright Data'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
