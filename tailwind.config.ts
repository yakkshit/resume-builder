import type { Config } from "tailwindcss";

function withOpacity(variableName: string): any {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
    }
    return `var(${variableName})`;
  };
}

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			background: withOpacity('--background'),
  			foreground: withOpacity('--foreground'),
  			card: {
  				DEFAULT: withOpacity('--card'),
  				foreground: withOpacity('--card-foreground')
  			},
  			popover: {
  				DEFAULT: withOpacity('--popover'),
  				foreground: withOpacity('--popover-foreground')
  			},
  			primary: {
  				DEFAULT: withOpacity('--primary'),
  				foreground: withOpacity('--primary-foreground')
  			},
  			secondary: {
  				DEFAULT: withOpacity('--secondary'),
  				foreground: withOpacity('--secondary-foreground')
  			},
  			muted: {
  				DEFAULT: withOpacity('--muted'),
  				foreground: withOpacity('--muted-foreground')
  			},
  			accent: {
  				DEFAULT: withOpacity('--accent'),
  				foreground: withOpacity('--accent-foreground')
  			},
  			destructive: {
  				DEFAULT: withOpacity('--destructive'),
  				foreground: withOpacity('--destructive-foreground')
  			},
  			border: withOpacity('--border'),
  			input: withOpacity('--input'),
  			ring: withOpacity('--ring'),
  			chart: {
  				'1': withOpacity('--chart-1'),
  				'2': withOpacity('--chart-2'),
  				'3': withOpacity('--chart-3'),
  				'4': withOpacity('--chart-4'),
  				'5': withOpacity('--chart-5')
  			},
  			sidebar: {
  				DEFAULT: withOpacity('--sidebar'),
  				foreground: withOpacity('--sidebar-foreground'),
  				primary: withOpacity('--sidebar-primary'),
  				'primary-foreground': withOpacity('--sidebar-primary-foreground'),
  				accent: withOpacity('--sidebar-accent'),
  				'accent-foreground': withOpacity('--sidebar-accent-foreground'),
  				border: withOpacity('--sidebar-border'),
  				ring: withOpacity('--sidebar-ring')
  			}
  		},
  		fontFamily: {
  			sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
  			serif: ['var(--font-serif)', 'Georgia', 'serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'shine-pulse': {
  				'0%': { backgroundPosition: '0% 0%' },
  				'50%': { backgroundPosition: '100% 100%' },
  				to: { backgroundPosition: '0% 0%' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;