import { useEffect, useState } from 'react'
import {
  FaArrowRight,
  FaBars,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaCloudSun,
  FaCompass,
  FaGlobe,
  FaHandshake,
  FaMapMarkerAlt,
  FaRocket,
  FaShoppingBag,
  FaStar,
  FaTimes,
  FaUsers,
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import logo from '../assets/camplify_ico.svg'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [openFaq, setOpenFaq] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  const navItems = [
    { id: 'home', label: 'Home', href: '#' },
    { id: 'features', label: 'Features', href: '#features' },
    { id: 'about', label: 'About Us', href: '#about' },
    { id: 'faq', label: 'FAQ', href: '#faq' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)

      const scrollPosition = window.scrollY + 250
      const sections = ['faq', 'about', 'features']
      
      let current = 'home'
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId)
        if (el && scrollPosition >= el.offsetTop) {
          current = sectionId
          break
        }
      }
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavClick = (id) => {
    setActiveSection(id)
    setMobileMenuOpen(false)
  }

  const faqs = [
    {
      q: 'Is Camplify free to use?',
      a: 'Yes! Camplify offers a free forever plan with full access to campsite discovery, trip creation, and collaborative gear checklists. Pro features are available for advanced offline map downloads.',
    },
    {
      q: 'Does Camplify work without an internet connection?',
      a: 'Absolutely. You can download full trip packages—including interactive trail maps, waypoints, itineraries, and gear checklists—before heading out into backcountry zero-signal areas.',
    },
    {
      q: 'How does the weather forecasting work?',
      a: 'Camplify pulls hyperlocal weather data accurate to within half a mile of your specific campsite, delivering 14-day forecasts and automated storm alerts directly to your trip dashboard.',
    },
    {
      q: 'Can I share trips with people who don\'t have the app?',
      a: 'Yes, you can generate shareable web links or email invitations so trip members can view schedules, sign up for gear, and RSVP without needing to download anything.',
    },
    {
      q: 'What camping locations are covered?',
      a: 'Camplify features 85,000+ curated campsites, national parks, state reserves, and backcountry wilderness locations across North America, Sri Lanka, and worldwide.',
    },
  ]

  return (
    <div className="min-h-screen bg-white text-[#14221A] antialiased selection:bg-[#35C96B] selection:text-white">
      {/* Header Navigation — Clean Light Aesthetic */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#EAF8EF]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={() => handleNavClick('home')}>
            <img src={logo} alt="Camplify" className="h-8 w-auto transition-transform group-hover:scale-105" />
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.id)}
                className={`home-nav-link ${activeSection === item.id ? 'active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="home-cta-primary"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-[#14221A] hover:text-[#35C96B] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="home-cta-primary"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="md:hidden p-2 text-[#123D28] hover:text-[#35C96B] focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#EAF8EF] px-6 py-4 space-y-3">
            <nav className="flex flex-col space-y-2 text-xs font-bold text-[#14221A]">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => handleNavClick(item.id)}
                  className={`py-1 transition-colors ${
                    activeSection === item.id
                      ? 'text-[#35C96B] font-extrabold'
                      : 'hover:text-[#35C96B]'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="pt-3 border-t border-[#EAF8EF] flex flex-col gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="home-cta-primary text-center justify-center w-full"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-xs font-bold text-[#14221A] hover:text-[#35C96B]"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="home-cta-primary text-center justify-center w-full"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section — Minimal, Airy & Clean */}
      <section className="relative w-full bg-gradient-to-b from-[#EAF8EF]/60 via-white to-white text-[#14221A] pt-16 pb-20 px-6 overflow-hidden border-b border-[#EAF8EF]">
        {/* Subtle Minimal Vector Mountain Silhouette Layer */}
        <div className="absolute inset-0 pointer-events-none -z-0 opacity-40">
          <svg
            className="absolute bottom-0 w-full h-44 sm:h-60 text-[#35C96B]/15"
            viewBox="0 0 1440 320"
            fill="currentColor"
            preserveAspectRatio="none"
          >
            <path d="M0,192L80,181.3C160,171,320,149,480,160C640,171,800,213,960,213.3C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-7 relative z-10">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#123D28] leading-tight">
            Plan Smarter. <br />
            <span className="text-[#35C96B]">Camp Better.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#52665A] font-medium leading-relaxed">
            Camplify brings together real-time hyperlocal weather, interactive map routes, group participant RSVPs, gear checklists, and smart itineraries — built for every outdoor adventure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="home-cta-primary w-full sm:w-auto"
            >
              Start Planning Free <FaArrowRight className="text-xs ml-1" />
            </Link>
            <a
              href="#features"
              className="home-cta-ghost w-full sm:w-auto"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-left space-y-2 mb-12">
          <p className="text-xs font-bold tracking-widest text-[#35C96B] uppercase">OUTDOOR TOOLKIT</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123D28] tracking-tight">
            Built to make group trips simple & stress-free
          </h2>
          <p className="text-xs sm:text-sm text-[#52665A] max-w-2xl">
            From quick weekend getaways to multi-day wilderness treks, Camplify keeps your entire team on the same page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="feature-card group p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="feature-icon w-11 h-11 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center text-base font-bold">
              <FaMapMarkerAlt />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#123D28]">Campsite Discovery</h3>
              <p className="text-xs text-[#52665A] leading-relaxed">
                Explore 85,000+ curated campsites, national parks, and reserves with photos, amenities, permit info, and GPS coordinates.
              </p>
            </div>
          </div>

          <div className="feature-card group p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="feature-icon w-11 h-11 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center text-base font-bold">
              <FaCloudSun />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#123D28]">Hyperlocal Weather</h3>
              <p className="text-xs text-[#52665A] leading-relaxed">
                14-day forecasts tailored to your exact trail coordinates. Get instant rain, wind, and temperature alerts before heading out.
              </p>
            </div>
          </div>

          <div className="feature-card group p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="feature-icon w-11 h-11 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center text-base font-bold">
              <FaUsers />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#123D28]">Group RSVP & Invites</h3>
              <p className="text-xs text-[#52665A] leading-relaxed">
                Invite friends via shareable web links or email invitations. Track RSVPs, member roles, and contact info in one place.
              </p>
            </div>
          </div>

          <div className="feature-card group p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="feature-icon w-11 h-11 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center text-base font-bold">
              <FaShoppingBag />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#123D28]">Collaborative Gear Lists</h3>
              <p className="text-xs text-[#52665A] leading-relaxed">
                Assign gear items across group members so no one double-packs or forgets essential safety equipment.
              </p>
            </div>
          </div>

          <div className="feature-card group p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="feature-icon w-11 h-11 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center text-base font-bold">
              <FaCalendarAlt />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#123D28]">Smart Itineraries</h3>
              <p className="text-xs text-[#52665A] leading-relaxed">
                Create structured day-by-day schedules for camp setups, trail hikes, meals, and group departures.
              </p>
            </div>
          </div>

          <div className="feature-card group p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="feature-icon w-11 h-11 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center text-base font-bold">
              <FaCompass />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#123D28]">Offline Trail Maps</h3>
              <p className="text-xs text-[#52665A] leading-relaxed">
                Download full trip details, maps, and offline waypoints before stepping into zero-signal wilderness areas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#EAF8EF]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-bold tracking-widest text-[#35C96B] uppercase">ABOUT CAMPLIFY</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123D28] tracking-tight leading-tight">
              Empowering adventurers to explore with confidence
            </h2>
            <p className="text-xs sm:text-sm text-[#52665A] leading-relaxed">
              Camplify was born out of a passion for the outdoors and a mission to make group trip planning effortless. We bring together real-time hyperlocal weather, curated campsite locations, collaborative gear checklists, and offline navigation into one unified experience.
            </p>
            <p className="text-xs sm:text-sm text-[#52665A] leading-relaxed">
              Whether you are planning a weekend car trip with family or leading a multi-day backcountry trek, Camplify keeps your entire crew organized every step of the way.
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#EAF8EF] shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center font-bold text-sm">
                <FaRocket />
              </div>
              <h4 className="text-xs font-bold text-[#123D28]">Our Story</h4>
              <p className="text-[11px] text-[#52665A]">
                Built by outdoor enthusiasts tired of juggling endless group chats and spreadsheet lists.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAF8EF] shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center font-bold text-sm">
                <FaGlobe />
              </div>
              <h4 className="text-xs font-bold text-[#123D28]">Global Reach</h4>
              <p className="text-[11px] text-[#52665A]">
                Curated campsites, national reserves, and backcountry wilderness routes across 50+ countries.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAF8EF] shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center font-bold text-sm">
                <FaHandshake />
              </div>
              <h4 className="text-xs font-bold text-[#123D28]">Community Driven</h4>
              <p className="text-[11px] text-[#52665A]">
                Verified camper reviews, amenity updates, and trail conditions maintained by real adventurers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAF8EF] shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#EAF8EF] text-[#35C96B] flex items-center justify-center font-bold text-sm">
                <FaStar />
              </div>
              <h4 className="text-xs font-bold text-[#123D28]">Free Forever</h4>
              <p className="text-[11px] text-[#52665A]">
                Core trip planning features are 100% free with no credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto border-t border-[#EAF8EF]">
        <div className="text-center space-y-2 mb-12">
          <p className="text-xs font-bold tracking-widest text-[#35C96B] uppercase">FREQUENTLY ASKED QUESTIONS</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#123D28] tracking-tight">
            Got questions? We've got answers.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="faq-card rounded-xl bg-white border border-[#EAF8EF] shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 text-left text-xs sm:text-sm font-bold text-[#123D28] flex items-center justify-between hover:bg-[#EAF8EF]/40 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-[#35C96B] ml-4">
                  {openFaq === index ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                </span>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-5 text-xs text-[#52665A] leading-relaxed border-t border-[#EAF8EF] pt-3 font-medium animate-fadeIn">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer matching high-contrast dark green accent theme */}
      <footer className="bg-[#123D28] text-white/80 text-xs py-16 px-6 border-t border-[#123D28]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Camplify" className="h-7 w-auto brightness-200" />
            </Link>
            <p className="text-xs text-white/70 leading-relaxed max-w-sm font-medium">
              Smart, collaborative trip planning tools for campers, hikers, and outdoor adventurers everywhere.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[#35C96B]">PRODUCT</h5>
            <ul className="space-y-2 text-xs font-medium">
              <li><a href="#features" className="hover:text-[#35C96B] transition-colors">Features</a></li>
              <li><Link to="/explore" className="hover:text-[#35C96B] transition-colors">Explore Spots</Link></li>
              <li><Link to="/pricing" className="hover:text-[#35C96B] transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[#35C96B]">ACCOUNT</h5>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link to="/login" className="hover:text-[#35C96B] transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-[#35C96B] transition-colors">Register</Link></li>
              <li><Link to="/dashboard" className="hover:text-[#35C96B] transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-[#35C96B]">LEGAL & SUPPORT</h5>
            <ul className="space-y-2 text-xs font-medium">
              <li><a href="#help" className="hover:text-[#35C96B] transition-colors">Help Center</a></li>
              <li><a href="#privacy" className="hover:text-[#35C96B] transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#35C96B] transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/60 gap-4 font-medium">
          <p>© {new Date().getFullYear()} Camplify, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Built for outdoor enthusiasts</span>
          </div>
        </div>
      </footer>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="scroll-top-btn"
          aria-label="Scroll to top"
        >
          <FaChevronUp className="text-sm" />
        </button>
      )}
    </div>
  )
}
