import React, { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: '¿Cómo funciona el servicio?',
    answer: (
      <div className="space-y-4">
        <p>¡Más fácil que preparar un café cubano! Solo sigue tres pasos:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li><strong>Elige tu paquete</strong>: Selecciona entre 3, 5 ó 7 días de comida.</li>
          <li><strong>Personaliza el menú</strong>: Combina las comidas disponibles según los gustos de tu familiar.</li>
          <li><strong>Indica la dirección</strong>: Dinos dónde entregarlo y ¡listo!</li>
        </ol>
        <p>
          La <strong>primera entrega</strong> llegará a la puerta de tu hogar <strong>a partir de 48 horas</strong> después de confirmar tu pedido. 
          Luego, recibirás entregas <strong>cada día</strong>, con comida fresca diaria. 
          ¡Así garantizamos que siempre disfruten de platos recién hechos!
        </p>
        <p>
          Por ejemplo, si el lunes pides un paquete de 3 comidas, las recibirías el miércoles, jueves y viernes.
        </p>
      </div>
    )
  },
  {
    question: '¿Cada cuánto tiempo recibo una entrega?',
    answer: (
      <div className="space-y-4">
        <p>
          Tu primera entrega <strong>a partir de las 48 horas</strong> tras confirmar el pedido. 
          Las siguientes llegarán <strong>cada día</strong>, respetando siempre el ritmo de tu paquete.
        </p>
        <p>
          Todas las entregas se realizan en una única franja horaria: entre <strong>11:00AM y 7:00PM</strong>, para asegurar que la comida llegue en el momento perfecto para ser disfrutada.
        </p>
        <p>Por ejemplo:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Toquecito XL: 3 entregas (ej. Si pediste un domingo. Martes: 1 comida / miércoles: 1 comida / jueves: 1 comida).</li>
          <li>Combo Completo XL: 7 entregas (ej. Si pediste un domingo. Martes: 1 comida / miércoles: 1 comida / jueves: 1 comida / viernes: 1 comida / sábado: 1 comida / domingo: 1 comida / lunes: 1 comida).</li>
        </ul>
        <p>¡Nunca te quedarás sin comida en la mesa!</p>
      </div>
    )
  },
  {
    question: '¿Qué zonas cubren actualmente?',
    answer: (
      <div className="space-y-4">
        <p>
          Hoy estamos entregando sonrisas (y comida caliente) en <strong>toda La Habana</strong>. 
          ¡Pronto llegaremos a más provincias!
        </p>
        <p>
          Si no estás en la zona, déjanos tu correo y serás el primero en saber cuando expandamos.
        </p>
      </div>
    )
  },
  {
    question: '¿Cuánto cuesta la entrega?',
    answer: (
      <div className="space-y-4">
        <p>
          ¡La mejor noticia! El costo de <strong>todas las entregas está incluido en el precio del paquete</strong>.
        </p>
        <p>
          No importa si vives en Miramar o Guanabacoa: si estás en nuestra zona de cobertura, <em>no pagarás un peso extra</em>. 
          ¡Nosotros nos encargamos de todo!
        </p>
      </div>
    )
  },
  {
    question: '¿Qué tipo de comidas ofrecen?',
    answer: (
      <div className="space-y-4">
        <p>
          Platos que saben a familia, tradición y Cuba. Servimos <strong>comidas caseras y abundantes</strong>, 
          preparadas con ingredientes frescos y el mismo cariño que tu abuela pondría.
        </p>
        <p>
          Desde arroz moro hasta bistec encebollado, cada bocado es un homenaje a nuestra cocina.
        </p>
      </div>
    )
  },
  {
    question: '¿Cómo garantizan la calidad y seguridad de las comidas?',
    answer: (
      <div className="space-y-4">
        <p>Tu seguridad es sagrada para nosotros. Por eso:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span><strong>Sanitización rigurosa</strong>: Cocinas certificadas y personal entrenado en normas de higiene.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span><strong>Empaque térmico</strong>: Cada comida viaja en recipientes termopacks desechables, que conservan la temperatura.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500">✓</span>
            <span><strong>Cadena de envío controlada</strong>: Transportamos los alimentos manteniendo una temperatura adecuada para su posterior consumo.</span>
          </li>
        </ul>
        <p><em>Desde la cocina hasta tu mesa, cuidamos cada detalle.</em></p>
      </div>
    )
  },
  {
    question: '¿Cómo recomendamos consumir las comidas de cada entrega?',
    answer: (
      <div className="space-y-4">
        <p>Te sugerimos:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span>🍽️</span>
            <span>Disfruta tu comida <strong>el mismo día de la entrega</strong> para máxima frescura.</span>
          </li>
          <li className="flex items-start gap-2">
            <span>⏲️</span>
            <span><strong>Al servir</strong>: Aprovecha la temperatura del plato recién entregado, o caliéntala en microondas o sartén y ¡listo!</span>
          </li>
          <li className="flex items-start gap-2">
            <span>❄️</span>
            <span>Si no puedes consumirla el mismo día: Guárdala <em>sin abrir</em> en el refrigerador.</span>
          </li>
        </ul>
        <p className="text-yellow-700 bg-yellow-50 p-4 rounded-lg flex items-start gap-2">
          <span>⚠️</span>
          <span><em>No recomendamos guardar las comidas más de 24 horas para preservar su sabor y calidad.</em></span>
        </p>
      </div>
    )
  },
  {
    question: '¿Puedo armar mi propio paquete de comidas?',
    answer: (
      <div className="space-y-4">
        <p>
          ¡Claro que sí! En nuestra web, <strong>tú eres el chef</strong>. Mezcla platos como prefieras: 
          ¿Arroz amarillo con pollo un día y lonjas de cerdo el siguiente? ¿Bistec de cerdo todos los días? ¡Hazlo posible!
        </p>
        <p>
          Personaliza cada paquete para que tu familiar reciba exactamente lo que le gusta.
        </p>
      </div>
    )
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: (
      <div className="space-y-4">
        <p>Paga como más te convenga:</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span>💳</span>
            <span><strong>Tarjetas de crédito/débito</strong> (Visa, Mastercard).</span>
          </li>
          <li className="flex items-start gap-2">
            <span>📲</span>
            <span><strong>Saldo Tropipay</strong>: Rápido y seguro.</span>
          </li>
        </ul>
        <p className="text-sm text-gray-600 italic">
          Todas las transacciones están protegidas con encriptación de última generación.
        </p>
      </div>
    )
  },
  {
    question: '¿En qué orden llegarán los platos que selecciono?',
    answer: (
      <div className="space-y-4">
        <p>
          ¡Tranquilo! Respetamos tus preferencias al 100%. Los platos llegarán <strong>exactamente en el mismo orden</strong> en que los seleccionaste al hacer tu pedido.
        </p>
        <p>
          Así, si elegiste comenzar con un delicioso arroz con pollo y terminar con un bistec encebollado, ¡así será! Esto te permite planificar el menú de la semana según tus antojos o necesidades.
        </p>
        <p>
          ¡Tú eres el chef y nosotros seguimos tu receta! 🍽️
        </p>
      </div>
    )
  },
  {
    question: '¿Cuál es la política de cancelación?',
    answer: (
      <div className="space-y-4">
        <p>
          Entendemos que los planes pueden cambiar. Por eso, puedes cancelar tu pedido <strong>dentro de las primeras 24 horas</strong> después de realizarlo, sin problema alguno.
        </p>
        <p>
          Para cancelar, simplemente contáctanos a través de:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span>💬</span>
            <span>El chat de nuestra web (¡respuesta rápida garantizada!)</span>
          </li>
          <li className="flex items-start gap-2">
            <span>📱</span>
            <span>Nuestro WhatsApp de atención al cliente</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✉️</span>
            <span>Escribiéndonos un email a <a href="mailto:soporte@cantinaxl.com" className="text-red-500 hover:text-red-600">soporte@cantinaxl.com</a></span>
          </li>
        </ul>
        <p>
          Nuestro equipo estará encantado de ayudarte con el proceso de cancelación de manera rápida y sencilla.
        </p>
      </div>
    )
  },
  {
    question: '¿Puedo hacer cambios en mi orden después de confirmarla?',
    answer: (
      <div className="space-y-4">
        <p>
          ¡Claro que sí! Sabemos que a veces necesitas ajustar tus planes. En lugar de cancelar tu pedido, te ofrecemos opciones más flexibles:
        </p>
        <p>
          <strong>Extensión con paquete adicional:</strong> ¿Necesitas más comidas? Podemos añadir un paquete adicional a tu orden existente, extendiendo así los días de servicio sin complicaciones.
        </p>
        <p>
          Esta opción es perfecta para cuando:
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span>✨</span>
            <span>Te encantó nuestro servicio y quieres extenderlo</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✨</span>
            <span>Tus planes cambiaron y necesitas más días de comida</span>
          </li>
          <li className="flex items-start gap-2">
            <span>✨</span>
            <span>Quieres probar más platos de nuestro menú</span>
          </li>
        </ul>
        <p>
          Contáctanos por WhatsApp o a través del chat web y te ayudaremos a personalizar tu experiencia. ¡Estamos para servirte!
        </p>
      </div>
    )
  }
];

export const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-red-500">PREGUNTAS FRECUENTES</h2>
            <p className="text-xl text-gray-600">
              Tu tranquilidad es nuestra prioridad. Aquí resolvemos todas tus dudas.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-medium pr-8">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openItems.includes(index) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openItems.includes(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-4">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg mb-4">¿Tienes más preguntas?</p>
            <p className="text-sm text-gray-500 mt-2">
              Escríbenos al <span className='text-red-500'>Chat de la web</span>. Estamos aquí para ayudarte. ¡No dudes en contactarnos!
            </p>
          </div>

          <div className="mt-12 text-center text-sm text-red-500 italic border-t border-gray-200 pt-8">
            CantinaXL. ¡El sabor de estar cerca!
          </div>
        </div>
      </div>
    </section>
  );
};
