
import { FaPhoneAlt, FaEnvelope, FaLock } from "react-icons/fa";

export default function ContactUs() {
  return (
    <div className="w-full py-16 bg-white">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Contactez-nous
          </h2>
          <p className="text-lg leading-relaxed text-gray-600">
            Notre équipe est là pour vous aider. N'hésitez pas à nous contacter pour toute question.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Contact Information */}
          <div className="order-2 lg:order-1">
            <div className="grid gap-8">
              {/* Contact Cards */}
              {[
                {
                  icon: <FaPhoneAlt className="w-5 h-5 text-blue-600" />,
                  title: "Téléphone",
                  details: ["+216 50 548 028", "+216 26 167 722"],
                },
                {
                  icon: <FaEnvelope className="w-5 h-5 text-blue-600" />,
                  title: "Email",
                  details: ["support@novares.com"],
                },
                {
                  icon: <FaLock className="w-5 h-5 text-blue-600" />,
                  title: "Sécurité des Données",
                  details: ["Transmissions sécurisées et cryptées"],
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-6 transition-all duration-300 bg-gray-100 shadow-lg rounded-2xl hover:shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                      {item.details.map((text, idx) => (
                        <p key={idx} className="text-gray-600 hover:text-blue-700">
                          {text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Hours Card */}
              <div className="p-6 transition-all duration-300 bg-gray-100 shadow-lg rounded-2xl hover:shadow-xl">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Heures d'ouverture</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Lundi - Vendredi</span>
                    <span className="font-medium text-gray-900">9:00 - 18:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Weekend</span>
                    <span className="font-medium text-gray-900">Fermé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="order-1 p-8 transition-all duration-300 bg-gray-100 shadow-lg rounded-2xl lg:order-2">
            <form className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {[
                  { label: "Nom", id: "name", type: "text" },
                  { label: "Email", id: "email", type: "email" },
                ].map((input) => (
                  <div key={input.id}>
                    <label htmlFor={input.id} className="block mb-2 text-sm font-medium text-gray-700">
                      {input.label}
                    </label>
                    <input
                      type={input.type}
                      id={input.id}
                      className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-300 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-700">
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-300 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  rows="6"
                  className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-300 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 text-base font-medium text-white transition-all duration-300 bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
              >
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
