'use client';

import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, Lock, AlertCircle, Database, Clock, Phone, Mail } from 'lucide-react';

export default function TerminosCondicionesPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-headline mb-4">Términos y Condiciones</h1>
          <p className="text-muted-foreground text-lg">
            Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-6">
          {/* Sección 1: Identificación del Responsable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                1. Identificación del Responsable del Tratamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <strong>Razón Social:</strong> IPS Virtual – Salud en Casa
              </p>
              <p>
                <strong>NIT:</strong> 900.XXX.XXX-X
              </p>
              <p>
                <strong>Domicilio:</strong> Bogotá D.C., Colombia
              </p>
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <strong>Correo electrónico de contacto:</strong><br />
                  <a href="mailto:datospersonales@ipsvirtual.com.co" className="text-primary hover:underline">
                    datospersonales@ipsvirtual.com.co
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <strong>Teléfono:</strong> +57 (601) 123-4567<br />
                  <strong>WhatsApp:</strong> +57 300 123 4567
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección 2: Autorización de Tratamiento de Datos Personales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                2. Autorización para el Tratamiento de Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-base">
                (En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013)
              </p>
              <p>
                Al registrarse en la plataforma, el usuario autoriza de manera <strong>previa, expresa e informada</strong> el tratamiento de sus datos personales por parte de <strong>IPS Virtual – Salud en Casa</strong>, para las siguientes finalidades:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Prestación de servicios de salud mediante telemedicina y consulta presencial.</li>
                <li>Gestión administrativa de citas médicas, recordatorios y seguimientos.</li>
                <li>Creación, actualización y custodia de la historia clínica electrónica.</li>
                <li>Emisión de fórmulas médicas, órdenes de exámenes y certificados de incapacidad.</li>
                <li>Facturación electrónica y gestión de pagos.</li>
                <li>Comunicación de resultados clínicos, diagnósticos y tratamientos.</li>
                <li>Envío de notificaciones relacionadas con la atención médica.</li>
                <li>Mejora continua de la plataforma mediante análisis estadísticos anonimizados.</li>
                <li>Cumplimiento de obligaciones legales del sector salud en Colombia.</li>
              </ul>
              
              <Separator className="my-4" />
              
              <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-4 rounded">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Datos Recopilados
                </h4>
                <p className="text-sm">
                  Se recopilarán datos de identificación (nombre, documento, fecha de nacimiento, género, dirección, teléfono, correo electrónico), 
                  datos de salud (antecedentes médicos, alergias, diagnósticos, tratamientos, resultados de exámenes), 
                  datos de navegación (dirección IP, cookies, logs de acceso) y datos de pago (cuando aplique).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sección 3: Tratamiento de Datos Sensibles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                3. Tratamiento de Datos Sensibles de Salud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-base">
                (Autorización Explícita según Ley 1581 de 2012, Art. 5 y 6)
              </p>
              <p>
                El usuario <strong>reconoce y acepta expresamente</strong> que la información relacionada con su salud, 
                antecedentes médicos, diagnósticos, resultados clínicos, historia clínica, tratamientos, 
                medicamentos prescritos, exámenes de laboratorio y cualquier otro dato relacionado con su condición física o mental 
                constituye <strong>datos sensibles</strong> según la legislación colombiana.
              </p>
              <p>
                El usuario <strong>autoriza de manera explícita y separada</strong> el tratamiento de estos datos sensibles 
                exclusivamente para las siguientes finalidades:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Finalidades asistenciales (diagnóstico, tratamiento, seguimiento médico).</li>
                <li>Finalidades administrativas del sector salud.</li>
                <li>Finalidades científicas, estadísticas o epidemiológicas (datos anonimizados).</li>
                <li>Cumplimiento de obligaciones legales establecidas por el Ministerio de Salud y Protección Social.</li>
                <li>Auditorías de calidad y habilitación de servicios de salud.</li>
              </ul>
              
              <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-4 rounded mt-4">
                <p className="text-sm font-semibold">
                  ⚠️ Esta autorización es independiente de la autorización general de datos personales y es requisito obligatorio 
                  para acceder a los servicios de salud de la plataforma.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sección 4: Historia Clínica Electrónica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                4. Historia Clínica Electrónica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-base">
                (Resolución 1995 de 1999 y Ley 23 de 1981)
              </p>
              <p>
                La historia clínica electrónica será administrada conforme a la normatividad vigente del sector salud en Colombia. 
                El usuario debe tener en cuenta lo siguiente:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Confidencialidad:</strong> La historia clínica es de carácter confidencial, privado e intransferible.
                </li>
                <li>
                  <strong>Acceso restringido:</strong> Solo podrá ser consultada por el personal médico o administrativo estrictamente 
                  autorizado para el cumplimiento de sus funciones.
                </li>
                <li>
                  <strong>Derecho a copia:</strong> El usuario podrá solicitar copia certificada de su historia clínica en cualquier momento, 
                  excepto en los apartados que la ley establece como de uso interno profesional (anotaciones subjetivas del profesional de salud).
                </li>
                <li>
                  <strong>Prohibición de entrega a terceros:</strong> La historia clínica NO podrá ser entregada a terceros sin orden judicial 
                  o autorización expresa del paciente.
                </li>
                <li>
                  <strong>Custodia:</strong> La IPS custodiará la historia clínica durante mínimo 15 años contados desde la última atención, 
                  según lo establece la normatividad colombiana.
                </li>
                <li>
                  <strong>Integridad:</strong> Toda modificación en la historia clínica quedará registrada con fecha, hora y usuario responsable, 
                  garantizando su trazabilidad e inalterabilidad.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Sección 5: Transferencia y Transmisión a Terceros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                5. Transferencia y Transmisión de Datos a Terceros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                La información del usuario podrá ser <strong>transferida o transmitida</strong> a proveedores tecnológicos tales como:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Plataformas de hosting y almacenamiento en la nube (ej. Google Cloud, AWS, Firebase).</li>
                <li>Servicios de mensajería (correo electrónico, SMS, WhatsApp Business API).</li>
                <li>Plataformas de facturación electrónica.</li>
                <li>Proveedores de pasarelas de pago.</li>
                <li>Servicios de analítica y monitoreo de plataforma.</li>
              </ul>
              <p>
                Estas transferencias se realizan <strong>estrictamente para la operación del servicio</strong> y cumpliendo con los 
                requisitos de seguridad y confidencialidad establecidos en la Ley 1581 de 2012.
              </p>
              
              <Separator className="my-4" />
              
              <h4 className="font-semibold">Transferencias Internacionales</h4>
              <p>
                En caso de realizar transferencias internacionales de datos a países fuera de Colombia, estas se harán únicamente a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Países con niveles adecuados de protección de datos personales, o</li>
                <li>Mediante contratos de transmisión que garanticen los estándares mínimos de seguridad y privacidad establecidos 
                  por la Superintendencia de Industria y Comercio (SIC).</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sección 6: Medidas de Seguridad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                6. Medidas de Seguridad Digital
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-base">
                (Ley 1581 de 2012 y lineamientos del MinTIC)
              </p>
              <p>
                IPS Virtual implementa medidas técnicas, humanas y administrativas razonables para proteger la información del usuario, 
                incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Cifrado:</strong> Uso de protocolos HTTPS y cifrado de datos en tránsito y en reposo.</li>
                <li><strong>Controles de acceso:</strong> Autenticación de múltiples factores y control de roles y permisos.</li>
                <li><strong>Almacenamiento seguro:</strong> Servidores con certificaciones de seguridad y respaldos periódicos.</li>
                <li><strong>Auditorías:</strong> Registro de todos los accesos y modificaciones a la información médica.</li>
                <li><strong>Monitoreo permanente:</strong> Detección de intentos de acceso no autorizado.</li>
                <li><strong>Capacitación:</strong> Formación continua del personal en protección de datos y confidencialidad.</li>
                <li><strong>Políticas internas:</strong> Protocolos de seguridad, respuesta a incidentes y gestión de vulnerabilidades.</li>
              </ul>
              
              <div className="bg-red-50 dark:bg-red-950 border-l-4 border-red-500 p-4 rounded mt-4">
                <p className="text-sm">
                  <strong>Importante:</strong> A pesar de las medidas implementadas, ningún sistema es 100% seguro. 
                  El usuario se compromete a mantener la confidencialidad de sus credenciales de acceso y a notificar 
                  inmediatamente cualquier uso no autorizado de su cuenta.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sección 7: Derechos del Usuario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                7. Derechos del Usuario como Titular de Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold text-base">
                (Ley 1581 de 2012, Artículo 8)
              </p>
              <p>
                El usuario tiene los siguientes derechos sobre sus datos personales:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">✓ Derecho de Acceso</h4>
                  <p className="text-sm">Conocer qué datos personales se tienen almacenados.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">✓ Derecho de Rectificación</h4>
                  <p className="text-sm">Actualizar o corregir información inexacta o incompleta.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">✓ Derecho de Supresión</h4>
                  <p className="text-sm">Solicitar la eliminación de datos cuando proceda legalmente.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">✓ Derecho de Revocatoria</h4>
                  <p className="text-sm">Retirar la autorización otorgada en cualquier momento.</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">✓ Derecho a Presentar Quejas</h4>
                  <p className="text-sm">Elevar quejas ante la Superintendencia de Industria y Comercio (SIC).</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">✓ Derecho de Consulta</h4>
                  <p className="text-sm">Conocer el uso y tratamiento dado a sus datos personales.</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Cómo Ejercer sus Derechos:</h4>
                <p className="mb-2">Para ejercer cualquiera de estos derechos, el usuario puede:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Enviar un correo electrónico a: <a href="mailto:datospersonales@ipsvirtual.com.co" className="text-primary hover:underline">datospersonales@ipsvirtual.com.co</a></li>
                  <li>Comunicarse al teléfono: +57 (601) 123-4567</li>
                  <li>Escribir por WhatsApp: +57 300 123 4567</li>
                  <li>Dirigirse personalmente a nuestras oficinas (con cita previa)</li>
                </ul>
                <p className="text-sm mt-3">
                  <strong>Plazo de respuesta:</strong> La IPS responderá las solicitudes dentro de los 15 días hábiles siguientes 
                  a la radicación de la petición. En caso de requerir información adicional, se notificará al usuario.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sección 8: Uso de la Plataforma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                8. Uso de la Plataforma y Responsabilidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  IMPORTANTE: Esta NO es una plataforma de emergencias
                </h4>
                <p className="text-sm">
                  La plataforma de telemedicina NO sustituye la atención de urgencias médicas. 
                  En caso de síntomas graves, dolor torácico, dificultad respiratoria, pérdida de consciencia, 
                  sangrado abundante o cualquier otra emergencia médica, el usuario deberá acudir <strong>inmediatamente</strong> 
                  al servicio de urgencias más cercano o llamar a la línea 123.
                </p>
              </div>
              
              <h4 className="font-semibold text-base mt-4">Obligaciones del Usuario:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proporcionar información verdadera, completa y actualizada.</li>
                <li>No suplantar la identidad de terceros.</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
                <li>Usar la plataforma exclusivamente para fines legítimos relacionados con su atención en salud.</li>
                <li>No compartir su cuenta con otras personas.</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta.</li>
                <li>Respetar los horarios de atención y la disponibilidad de los profesionales.</li>
              </ul>
              
              <h4 className="font-semibold text-base mt-4">Responsabilidad de la IPS:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>La IPS se compromete a prestar servicios de salud con calidad y profesionalismo.</li>
                <li>La IPS NO se hace responsable por decisiones tomadas con base en información incompleta o incorrecta 
                  suministrada por el usuario.</li>
                <li>La IPS NO garantiza disponibilidad del 100% del servicio por causas de fuerza mayor, mantenimiento programado 
                  o fallas técnicas ajenas a su control.</li>
                <li>La IPS podrá suspender o cancelar cuentas por uso indebido, fraude, suplantación de identidad o 
                  incumplimiento de estos términos.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sección 9: Cookies y Analítica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                9. Cookies y Analítica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                El sitio web y la plataforma utilizan <strong>cookies técnicas y de analítica</strong> para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Mejorar la experiencia de navegación del usuario.</li>
                <li>Medir el rendimiento y uso de la plataforma.</li>
                <li>Recordar preferencias de usuario (idioma, tema, etc.).</li>
                <li>Mantener la sesión activa de forma segura.</li>
                <li>Realizar análisis estadísticos agregados y anonimizados.</li>
              </ul>
              <p>
                El usuario puede <strong>deshabilitar las cookies</strong> desde la configuración de su navegador web. 
                Sin embargo, esto puede afectar la funcionalidad de la plataforma.
              </p>
              <p className="text-sm text-muted-foreground">
                No se utilizan cookies de terceros con fines publicitarios o de seguimiento sin consentimiento expreso.
              </p>
            </CardContent>
          </Card>

          {/* Sección 10: Vigencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                10. Vigencia de la Autorización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                La autorización otorgada para el tratamiento de datos personales estará <strong>vigente</strong> hasta que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>El usuario solicite expresamente su revocatoria.</li>
                <li>Se finalice la relación contractual con la IPS.</li>
                <li>Se cumpla la finalidad para la cual fueron recopilados los datos.</li>
              </ul>
              
              <Separator className="my-4" />
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-500 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Importante:</strong> Aún después de la revocatoria, la IPS conservará la historia clínica y 
                  datos relacionados durante <strong>mínimo 15 años</strong> contados desde la última atención, 
                  en cumplimiento de obligaciones legales del sector salud (Resolución 1995 de 1999).
                </p>
              </div>
              
              <p className="mt-4">
                Durante este periodo de custodia legal, los datos estarán protegidos con las mismas medidas de seguridad 
                y solo podrán ser consultados por autoridades competentes con orden judicial o en cumplimiento de 
                obligaciones legales (auditorías, inspecciones de salud, etc.).
              </p>
            </CardContent>
          </Card>

          {/* Sección 11: Modificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                11. Modificaciones a los Términos y Condiciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                IPS Virtual se reserva el derecho de modificar estos términos y condiciones en cualquier momento. 
                Las modificaciones entrarán en vigencia desde su publicación en la plataforma.
              </p>
              <p>
                Los usuarios registrados serán notificados de cambios sustanciales mediante correo electrónico o 
                notificación en la plataforma. El uso continuado de los servicios después de la notificación constituirá 
                la aceptación de los nuevos términos.
              </p>
              <p className="text-sm text-muted-foreground">
                Se recomienda revisar periódicamente esta página para mantenerse informado sobre actualizaciones.
              </p>
            </CardContent>
          </Card>

          {/* Sección 12: Ley Aplicable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                12. Ley Aplicable y Jurisdicción
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Estos términos y condiciones se rigen por las leyes de la República de Colombia, en especial:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                <li>Ley 1581 de 2012 (Protección de Datos Personales)</li>
                <li>Decreto 1377 de 2013 (Reglamentario de la Ley 1581)</li>
                <li>Ley 1266 de 2008 (Habeas Data)</li>
                <li>Ley 23 de 1981 (Ética Médica)</li>
                <li>Resolución 1995 de 1999 (Historia Clínica)</li>
                <li>Lineamientos del Ministerio de Salud y Protección Social sobre Telemedicina</li>
              </ul>
              <p className="mt-4">
                Para cualquier controversia o reclamación derivada de estos términos, las partes se someterán a la 
                jurisdicción de los jueces y tribunales de la República de Colombia.
              </p>
            </CardContent>
          </Card>

          {/* Contacto Final */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contacto para Consultas y Ejercicio de Derechos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Si tiene preguntas sobre estos términos y condiciones o desea ejercer sus derechos como titular de datos personales:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:datospersonales@ipsvirtual.com.co" className="text-primary hover:underline">
                    datospersonales@ipsvirtual.com.co
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+57 (601) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>WhatsApp: +57 300 123 4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Lun - Vie: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground py-8">
            <p>
              Al registrarse en la plataforma, usted declara haber leído, entendido y aceptado en su totalidad 
              estos términos y condiciones.
            </p>
            <p className="mt-2 font-semibold">
              Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
