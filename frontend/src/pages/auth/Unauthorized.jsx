import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { AlertTriangle } from "lucide-react"

const Unauthorized = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <CardTitle className="text-2xl font-bold text-red-600">Acceso No Autorizado</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            No tienes los permisos necesarios para acceder a esta página. Por favor, contacta al administrador si crees
            que esto es un error.
          </p>
          <Link to="/">
            <Button className="w-full">Volver al Inicio</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default Unauthorized
