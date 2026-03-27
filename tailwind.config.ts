import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			brand: {
  				'50': '#eef2ff',
  				'100': '#e0e7ff',
  				'500': '#6366f1',
  				'600': '#4f46e5',
  				'700': '#4338ca'
  			}
  		},
  		animation: {
  			'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear'
  		},
  		keyframes: {
  			'border-beam': {
  				'100%': {
  					'offset-distance': '100%'
  				}
  			}
  		}
  	}
  },
  plugins: [],
};

export default config;
