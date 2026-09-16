import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-6 py-14">

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* BRAND */}
          <div>
            <h2 className="spidey-font text-2xl text-red-600 mb-4">
              OpenTL
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              The ultimate voice, audio, and chat hub for communities.
              Swing into secure conversations with zero lag.
            </p>
          </div>

          {/* PRODUCT */}
          <div>
            <h3 className="text-white font-bold mb-4">Overview</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="/" className="hover:text-red-500 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-red-500 transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-red-500 transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/chatbot" className="hover:text-red-500 transition">
                  Chatbot
                </Link>
              </li>
              <li>
                <Link href="streaming-meetings" className="hover:text-red-500 transition">
                  streaming & meetings
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3 className="text-white font-bold mb-4">Services</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>
                <Link href="" className="hover:text-red-500 transition">
                  Real-time chat
                </Link>
              </li>
              <li>
                <Link href="" className="hover:text-red-500 transition">
                  Real-time Voice & Audio
                </Link>
              </li>
              <li>
                <Link href="" className="hover:text-red-500 transition">
                  Real-time video chat
                </Link>
              </li>
              <li>
                <Link href="" className="hover:text-red-500 transition">
                  Real World chat-bot
                </Link>
              </li>
            </ul>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="text-white font-bold mb-4">Connect</h3>
            <div className="flex gap-4">
              {["Twitter", "Instagram", "GitHub"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-gray-400 hover:border-red-600 hover:text-white transition"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} OpenTL. All rights reserved.</p>

          <div className="flex gap-6">
            <Link href="#" className="hover:text-red-500 transition">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-red-500 transition">
              Terms of Service
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}