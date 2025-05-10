declare global {
  var dbConnected: boolean
  var dbConfig: {
    host: string
    port: string | number
    user: string
    password: string
    database: string
  } | null
}

export {}
