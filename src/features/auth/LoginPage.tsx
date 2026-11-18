import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/Button'
import styles from './AuthPages.module.scss'

interface LoginValues {
  userName: string
  password: string
  rememberMe: boolean
}

const initialValues: LoginValues = { userName: '', password: '', rememberMe: false }

// Mirrors DairyWebApp's LoginViewModel (Models\AccountViewModels.cs): UserName
// and Password are both required, RememberMe is a plain unvalidated checkbox.
const validationSchema = Yup.object().shape({
  userName: Yup.string().required('The User name field is required.'),
  password: Yup.string().required('The Password field is required.'),
})

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.wrap}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setError(null)
          try {
            const auth = await authApi.login(values)
            login(auth)
            navigate('/')
          } catch (err) {
         
            setError(err instanceof Error ? err.message : 'Invalid username or password.')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className={styles.card}>
            <h2 className={styles.title}>Login</h2>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="userName">UserName</label>
              <Field id="userName" name="userName" type="text" autoComplete="off" />
              <ErrorMessage name="userName" component="div" className={styles.fieldError} />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <Field id="password" name="password" type="password" />
              <ErrorMessage name="password" component="div" className={styles.fieldError} />
            </div>

            <div className={styles.checkboxRow}>
              <Field id="rememberMe" name="rememberMe" type="checkbox" />
              <label htmlFor="rememberMe">RememberMe</label>
            </div>

            <Button type="submit" className={styles.submit} disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>

            <div className={styles.footerLink}>
              <Link to="/register">Don't have an account? Sign up</Link>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
