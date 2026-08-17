import { useState } from 'react'
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCampground,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaCloudSun,
  FaCompass,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaStar,
  FaUsers,
} from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState(null)
  const [emailInput, setEmailInput] = useState('')

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const handleCtaSubmit = (e) => {
    e.preventDefault()
    if (emailInput) {
      navigate(`/register?email=${encodeURIComponent(emailInput)}`)
    } else {
      navigate('/register')
    }
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
    <div className="min-h-screen bg-[#F6F4EC] text-[#1e2d24] font-sans antialiased selection:bg-[#265239] selection:text-white">
      <header className="sticky top-0 z-50 bg-[#0c1c12]/90 backdrop-blur-md border-b border-emerald-950/40 text-white">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="w-9 h-9 rounded-full bg-[#2a6847] border border-emerald-500/30 flex items-center justify-center text-white text-base shadow-md group-hover:scale-105 transition-transform">
              <FaCampground />
            </span>
            <span className="text-xl font-bold tracking-tight text-white font-sans">
              Camplify
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-9 text-xs font-semibold text-gray-300 tracking-wide uppercase">
            <a href="#features" className="hover:text-emerald-300 transition-colors">Features</a>
            <a href="#locations" className="hover:text-emerald-300 transition-colors">Locations</a>
            <a href="#pricing" className="hover:text-emerald-300 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-[#2a6847] hover:bg-[#215338] text-white font-bold text-xs rounded-full shadow-lg transition-all hover:scale-[1.02]"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-[#2a6847] hover:bg-[#215338] text-white font-bold text-xs rounded-full shadow-lg transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative bg-[#0c1c12] text-white pt-16 pb-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay -z-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=90')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1c12]/60 via-[#0c1c12]/80 to-[#0c1c12] -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-7 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-[#60c48e] text-[11px] font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now with 85,000+ camping locations across North America
          </div>

          <h1 className="text-5xl sm:text-7xl font-normal tracking-tight text-white font-['Instrument_Serif',serif] leading-[1.08]">
            Plan Smarter. <br />
            <span className="italic text-[#e6b847]">Camp Better.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-300 font-normal leading-relaxed opacity-90">
            Camplify brings together real-time weather, curated locations, group coordination, gear management, and smart planning — everything you need to make every trip your best one yet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#265239] hover:bg-[#1e422e] text-white font-bold text-xs rounded-full shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Get Started Free <FaArrowRight className="text-[10px]" />
            </Link>
            <a
              href="#toolkit"
              className="w-full sm:w-auto px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-full backdrop-blur-sm border border-white/15 transition-all text-center"
            >
              Learn More
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-14 border-t border-emerald-900/40 max-w-3xl mx-auto text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-normal font-['Instrument_Serif',serif] text-white">85K+</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Camping Locations</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-normal font-['Instrument_Serif',serif] text-white">240K+</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Happy Campers</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-normal font-['Instrument_Serif',serif] text-white">4.9 ★</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">App Store Rating</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-normal font-['Instrument_Serif',serif] text-white">14-Day</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">Weather Forecasts</p>
            </div>
          </div>
        </div>
      </section>

      <section id="toolkit" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-left space-y-3 mb-14">
          <p className="text-[11px] font-bold tracking-widest text-[#a87432] uppercase">EVERYTHING YOU NEED</p>
          <h2 className="text-3xl sm:text-4xl font-normal text-[#1e2d24] font-['Instrument_Serif',serif] tracking-tight">
            Your complete outdoor planning toolkit
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
            From the first spark of an idea to the last ember of the campfire, Camplify handles every detail so you can focus on the adventure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-[#265239] text-white space-y-4 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white text-base">
              <FaMapMarkerAlt />
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-bold text-white">Discover Camping Spots</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Browse 85,000+ curated locations with detailed maps, photos, permit requirements, and real-time availability — filtered to exactly what your group needs.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white text-[#1e2d24] space-y-4 shadow-sm border border-[#e8e4d8] flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-[#f2eee3] flex items-center justify-center text-[#265239] text-base">
              <FaCloudSun />
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-bold text-[#1e2d24]">Real-Time Weather</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Hyperlocal 14-day forecasts accurate to within half a mile of your exact campsite. Rain, wind, and lightning alerts delivered before you even pack.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white text-[#1e2d24] space-y-4 shadow-sm border border-[#e8e4d8] flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-[#f2eee3] flex items-center justify-center text-[#265239] text-base">
              <FaUsers />
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-bold text-[#1e2d24]">Participant Management</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Invite friends, assign tasks, track RSVPs, and coordinate logistics across groups of any size — from weekend duos to 30-person family reunions.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white text-[#1e2d24] space-y-4 shadow-sm border border-[#e8e4d8] flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-[#f2eee3] flex items-center justify-center text-[#265239] text-base">
              <FaShoppingBag />
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-bold text-[#1e2d24]">Gear & Equipment Shops</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Rent or buy from vetted local outfitters. Smart checklist templates auto-assign gear by skill level and sync across your entire group.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white text-[#1e2d24] space-y-4 shadow-sm border border-[#e8e4d8] flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-[#f2eee3] flex items-center justify-center text-[#265239] text-base">
              <FaCalendarAlt />
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-bold text-[#1e2d24]">Smart Trip Planning</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                AI-powered itinerary builder creates day-by-day schedules accounting for drive time, trail difficulty, elevation, and incoming weather windows.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white text-[#1e2d24] space-y-4 shadow-sm border border-[#e8e4d8] flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-[#f2eee3] flex items-center justify-center text-[#265239] text-base">
              <FaCompass />
            </div>
            <div className="space-y-2 mt-4">
              <h3 className="text-lg font-bold text-[#1e2d24]">Offline Navigation</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Download trail maps, waypoints, and your full trip package before leaving. Full functionality with zero cell signal, no exceptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[#e5e1d5]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <p className="text-[11px] font-bold tracking-widest text-[#a87432] uppercase">APP PREVIEW</p>
            <h2 className="text-3xl sm:text-4xl font-normal text-[#1e2d24] font-['Instrument_Serif',serif] leading-tight">
              Your adventure, <br />
              <span className="italic text-[#265239]">beautifully organized</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              A dashboard designed for the outdoors — clean at a glance, powerful in the details. See upcoming trips, team status, weather windows, and gear readiness all in one view.
            </p>

            <ul className="space-y-3 pt-2 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3eedf] text-[#265239] flex items-center justify-center text-[10px]"><FaCheck /></span>
                Unified trip dashboard with live hyperlocal weather
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3eedf] text-[#265239] flex items-center justify-center text-[10px]"><FaCheck /></span>
                Group messaging, task assignments & RSVP tracking
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3eedf] text-[#265239] flex items-center justify-center text-[10px]"><FaCheck /></span>
                Interactive maps with full offline download
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3eedf] text-[#265239] flex items-center justify-center text-[10px]"><FaCheck /></span>
                Gear checklists synced automatically across your team
              </li>
            </ul>

            <div className="pt-4">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#265239] hover:bg-[#1e422e] text-white font-bold text-xs rounded-full shadow-md transition-all"
              >
                Explore the app <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 relative">
            <div className="absolute -top-4 right-4 z-20 px-3.5 py-1.5 bg-[#fff8e7] border border-[#f0dfaa] shadow-lg rounded-xl text-[10px] font-bold text-[#8a5d14] flex items-center gap-2 animate-bounce">
              <span>⚡ WEATHER ALERT</span>
              <span className="font-normal text-gray-600">Rain Sunday 2–6 PM</span>
            </div>

            <div className="rounded-2xl border border-gray-300 shadow-2xl overflow-hidden bg-[#102317]">
              <div className="bg-[#1f372a] px-4 py-2.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-[10px] text-emerald-200/70 font-mono">app.camplify.co</span>
                </div>
              </div>

              <div className="p-6 bg-[#12281a] space-y-5">
                <div className="p-4 bg-[#1b3d28] text-white rounded-xl border border-emerald-800/40 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-emerald-300 font-semibold">NEXT TRIP</p>
                    <h4 className="text-base font-bold font-['Instrument_Serif',serif] text-white">Yahangala Summit Camp — 3 days</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-emerald-300">Departs</p>
                    <p className="text-xs font-bold text-white">Aug 14</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#173222] rounded-xl border border-emerald-800/40 text-center space-y-1">
                    <p className="text-[10px] text-gray-300 font-semibold">Fri</p>
                    <p className="text-lg">☀️</p>
                    <p className="text-xs font-bold text-white">28°C</p>
                    <p className="text-[9px] text-gray-400">Clear</p>
                  </div>
                  <div className="p-3 bg-[#173222] rounded-xl border border-emerald-800/40 text-center space-y-1">
                    <p className="text-[10px] text-gray-300 font-semibold">Sat</p>
                    <p className="text-lg">🌤️</p>
                    <p className="text-xs font-bold text-white">26°C</p>
                    <p className="text-[9px] text-gray-400">Partly cloudy</p>
                  </div>
                  <div className="p-3 bg-[#173222] rounded-xl border border-emerald-800/40 text-center space-y-1">
                    <p className="text-[10px] text-gray-300 font-semibold">Sun</p>
                    <p className="text-lg">🌧️</p>
                    <p className="text-xs font-bold text-white">22°C</p>
                    <p className="text-[9px] text-amber-400 font-semibold">Rain – alert</p>
                  </div>
                </div>

                <div className="h-28 rounded-xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80"
                    alt="Knuckles Range"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white flex items-center gap-1 font-semibold">
                    <FaMapMarkerAlt className="text-emerald-400" /> Udugumbara, Sri Lanka
                  </div>
                </div>

                <div className="bg-[#173222] p-4 rounded-xl border border-emerald-800/40 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                    <span>PARTICIPANTS (3 of 4 confirmed)</span>
                  </div>
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between text-gray-200">
                      <span>Alex Johnson</span>
                      <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-300 text-[9px] font-bold rounded-full">Confirmed</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-200">
                      <span>Nimal Perera</span>
                      <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-300 text-[9px] font-bold rounded-full">Confirmed</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-200">
                      <span>Samantha K.</span>
                      <span className="px-2 py-0.5 bg-amber-900/80 text-amber-300 text-[9px] font-bold rounded-full">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 left-6 z-20 px-4 py-2.5 bg-[#173222] border border-emerald-700/50 shadow-xl rounded-xl text-xs font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#265239] text-white flex items-center justify-center text-xs"><FaShoppingBag /></span>
              <div>
                <p className="text-[9px] text-gray-300 uppercase font-semibold">Gear ready</p>
                <p className="text-xs font-bold text-emerald-300">18 of 22 items ✓</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-[#e5e1d5]">
        <div className="text-center space-y-3 mb-14">
          <p className="text-[11px] font-bold tracking-widest text-[#a87432] uppercase">TESTIMONIALS</p>
          <h2 className="text-3xl sm:text-4xl font-normal text-[#1e2d24] font-['Instrument_Serif',serif] tracking-tight">
            Trusted by adventurers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-white text-[#1e2d24] border border-[#e8e4d8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex text-amber-400 text-xs gap-1">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                "Camplify turned our chaotic group camping trip into smooth, memorable adventures. The weather alerts alone saved our last outing when a storm rolled in unexpectedly."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                SM
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Sarah Müller</p>
                <p className="text-[10px] text-gray-500">Weekend Adventurer · Portland, OR</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-[#265239] text-white shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex text-amber-400 text-xs gap-1">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                "The offline maps are a genuine game-changer. I hiked a 5-day solo through the Cascades without one cell signal — Camplify had every trail detail and waypoint I needed."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-emerald-800/60">
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">
                JT
              </div>
              <div>
                <p className="text-xs font-bold text-white">James Thornton</p>
                <p className="text-[10px] text-emerald-200/70">Backcountry Hiker · Seattle, WA</p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white text-[#1e2d24] border border-[#e8e4d8] shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex text-amber-400 text-xs gap-1">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                "Organizing a 14-person family reunion campout used to be a 3-week nightmare. Now it takes about 30 minutes. Everyone gets their assignments and maps automatically."
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                PK
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Priya Krishnamurthy</p>
                <p className="text-[10px] text-gray-500">Family Trip Organizer · Denver, CO</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-28 px-6 text-center text-white overflow-hidden my-6">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-[0.4] -z-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        <div className="max-w-3xl mx-auto space-y-3">
          <blockquote className="text-3xl sm:text-5xl font-normal font-['Instrument_Serif',serif] italic tracking-tight text-white leading-snug">
            "The mountains are calling and I must go."
          </blockquote>
          <p className="text-xs text-emerald-300 tracking-widest uppercase font-semibold">— John Muir</p>
        </div>
      </section>

      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <p className="text-[11px] font-bold tracking-widest text-[#a87432] uppercase">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-normal text-[#1e2d24] font-['Instrument_Serif',serif] tracking-tight">
            Common questions
          </h2>
          <p className="text-xs text-gray-600">Everything you need to know about Camplify.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white border border-[#e8e4d8] shadow-sm overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50/50"
              >
                <span>{faq.q}</span>
                <span className="text-gray-400 ml-4">
                  {openFaq === index ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                </span>
              </button>
              {openFaq === index && (
                <div className="px-6 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-[#0c1c12] text-white text-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay -z-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=2000&q=90')`,
          }}
        />

        <div className="max-w-3xl mx-auto space-y-7 relative">
          <p className="text-[11px] font-bold tracking-widest text-[#e6b847] uppercase">START FOR FREE</p>

          <h2 className="text-4xl sm:text-6xl font-normal font-['Instrument_Serif',serif] tracking-tight leading-tight">
            Your next adventure <br />
            <span className="italic text-[#e6b847]">starts here</span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto font-normal opacity-90 leading-relaxed">
            Join 240,000+ campers who plan smarter. Free forever on the basics — upgrade when you're ready.
          </p>

          <form onSubmit={handleCtaSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full px-5 py-2.5 bg-transparent text-white placeholder-gray-400 text-xs outline-none"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-gray-100 text-[#0c1c12] font-bold text-xs rounded-full whitespace-nowrap transition-colors"
            >
              Get Started Free
            </button>
          </form>

          <p className="text-[10px] text-gray-400 font-medium">
            No credit card required. Set up your first trip in 2 minutes.
          </p>
        </div>
      </section>

      <footer className="bg-[#08130c] text-gray-400 text-xs py-16 px-6 border-t border-emerald-950/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-emerald-900/40">
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-full bg-[#2a6847] text-white flex items-center justify-center text-xs">
                <FaCampground />
              </span>
              <span className="text-base font-bold text-white tracking-tight">Camplify</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Smart tools for every camper — from weekend car campers to serious backcountry adventurers.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">PRODUCT</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#toolkit" className="hover:text-white transition-colors">Features</a></li>
              <li><Link to="/explore" className="hover:text-white transition-colors">Locations</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><a href="#changelog" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">COMPANY</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#press" className="hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">SUPPORT</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#community" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#status" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
          <p>© 2026 Camplify, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#cookies" className="hover:text-gray-300 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
