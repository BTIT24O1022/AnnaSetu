import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../context/AuthContext'

export const metadata = {
  title: 'AnnaSetu — अन्न सेतु',
  description: 'Connecting surplus food donors to NGOs and communities in need',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}