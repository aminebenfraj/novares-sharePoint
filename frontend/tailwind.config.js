/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	extend: {
  		screens: {
  			sm: '576px',
  			md: '960px',
  			lg: '1537px'
  		},
  		fontFamily: {
  			inter: [
  				'inter',
  				'sans-serif'
  			],
  			opensans: [
  				'opensans',
  				'sans-serif'
  			],
  			poppins: [
  				'poppins',
  				'sans-serif'
  			],
  			lexend: [
  				'lexend',
  				'sans-serif'
  			],
  			lato: [
  				'lato',
  				'sans-serif'
  			],
  			rubik: [
  				'rubik',
  				'sans-serif'
  			]
  		},
  		backgroundColor: {
  			transparent: 'rgba(254, 254, 254, 0.9)',
  			greeen: 'rgba(34, 181, 20, 0.51)',
  			pink: 'rgba(154, 31, 194, 0.51)',
  			purple: 'rgba(154, 31, 194, 0.51)',
  			ColorBorder: 'rgba(0, 0, 0, 0.15)',
  			ColorBall: 'rgba(101, 236, 163, 0.88)',
  			ColorInjury: 'rgba(101, 152, 236, 0.16)',
  			ColorBorderbg: 'rgba(101, 152, 236, 0.08)',
  			ColorQuiz: 'rgba(82, 82, 108, 0.8)',
  			ColorArticular: 'radial-gradient(circle, #FF0000 100%, #FF000000 0%)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: '#6194FA',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
