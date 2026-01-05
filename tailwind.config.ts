import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
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
				},
				'neon-violet': 'hsl(var(--neon-violet))',
				'neon-yellow': 'hsl(var(--neon-yellow))',
				'neon-green': 'hsl(var(--neon-green))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'typing': {
					'from': { width: '0' },
					'to': { width: '100%' }
				},
				'blink-caret': {
					'from, to': { borderColor: 'transparent' },
					'50%': { borderColor: 'hsl(var(--primary))' }
				},
				'digital-rain': {
					'0%': { transform: 'translateY(-100%)' },
					'100%': { transform: 'translateY(100%)' }
				},
				'hologram-sweep': {
					'0%': { transform: 'translateX(-100%) skewX(-45deg)' },
					'100%': { transform: 'translateX(200%) skewX(-45deg)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' }
				},
				'emoji-float-1': {
					'0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
					'25%': { transform: 'translate(-10px, -15px) rotate(-15deg) scale(1.1)' },
					'50%': { transform: 'translate(5px, -25px) rotate(10deg) scale(1.05)' },
					'75%': { transform: 'translate(-5px, -10px) rotate(-5deg) scale(1.15)' }
				},
				'emoji-float-2': {
					'0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
					'25%': { transform: 'translate(12px, -20px) rotate(20deg) scale(1.15)' },
					'50%': { transform: 'translate(-8px, -30px) rotate(-10deg) scale(1.1)' },
					'75%': { transform: 'translate(10px, -15px) rotate(15deg) scale(1.05)' }
				},
				'emoji-float-3': {
					'0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
					'30%': { transform: 'translate(-15px, -10px) rotate(-20deg) scale(1.2)' },
					'60%': { transform: 'translate(10px, -25px) rotate(15deg) scale(1.1)' },
					'80%': { transform: 'translate(-5px, -18px) rotate(-10deg) scale(1.05)' }
				},
				'emoji-float-4': {
					'0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
					'20%': { transform: 'translate(8px, -22px) rotate(25deg) scale(1.15)' },
					'50%': { transform: 'translate(-12px, -28px) rotate(-15deg) scale(1.2)' },
					'70%': { transform: 'translate(15px, -12px) rotate(10deg) scale(1.1)' }
				},
				'emoji-float-5': {
					'0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
					'25%': { transform: 'translate(-8px, -25px) rotate(-25deg) scale(1.1)' },
					'50%': { transform: 'translate(15px, -18px) rotate(20deg) scale(1.15)' },
					'75%': { transform: 'translate(-10px, -30px) rotate(-12deg) scale(1.2)' }
				},
				'pulse-neon': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.8)' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'typing': 'typing 3.5s steps(40, end)',
				'blink-caret': 'blink-caret 0.75s step-end infinite',
				'digital-rain': 'digital-rain 20s linear infinite',
				'hologram-sweep': 'hologram-sweep 3s ease-in-out infinite',
				'float': 'float 6s ease-in-out infinite',
				'emoji-float-1': 'emoji-float-1 4s ease-in-out infinite',
				'emoji-float-2': 'emoji-float-2 5s ease-in-out infinite',
				'emoji-float-3': 'emoji-float-3 4.5s ease-in-out infinite',
				'emoji-float-4': 'emoji-float-4 5.5s ease-in-out infinite',
				'emoji-float-5': 'emoji-float-5 4.8s ease-in-out infinite',
				'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
