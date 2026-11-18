import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/Button'
import styles from './AuthPages.module.scss'

interface RegisterValues {
  userName: string
  email: string
  password: string
  confirmPassword: string
}

const initialValues: RegisterValues = { userName: '', email: '', password: '', confirmPassword: '' }


const validationSchema = Yup.object().shape({
  userName: Yup.string().required('The User name field is required.'),
  email: Yup.string().email('The Email field is not a valid e-mail address.'),
  password: Yup.string()
    .required('The Password field is required.')
    .min(6, 'The Password must be at least 6 characters long.')
    .matches(/[a-z]/, 'Passwords must have at least one lowercase (\'a\'-\'z\').')
    .matches(/[A-Z]/, 'Passwords must have at least one uppercase (\'A\'-\'Z\').')
    .matches(/[0-9]/, 'Passwords must have at least one digit (\'0\'-\'9\').'),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref('password')],
    'The password and confirmation password do not match.',
  ),
})

export function RegisterPage() {
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
            const auth = await authApi.register(values)
            login(auth)
            navigate('/')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed.')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className={styles.card}>
            <h2 className={styles.title}>Register</h2>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label htmlFor="userName">UserName</label>
              <Field id="userName" name="userName" type="text" autoComplete="off" />
              <ErrorMessage name="userName" component="div" className={styles.fieldError} />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <Field id="email" name="email" type="email" autoComplete="off" />
              <ErrorMessage name="email" component="div" className={styles.fieldError} />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <Field id="password" name="password" type="password" />
              <ErrorMessage name="password" component="div" className={styles.fieldError} />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword">ConfirmPassword</label>
              <Field id="confirmPassword" name="confirmPassword" type="password" />
              <ErrorMessage name="confirmPassword" component="div" className={styles.fieldError} />
            </div>

            <div className={styles.actions}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing up...' : 'Signup'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/login')}>
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
