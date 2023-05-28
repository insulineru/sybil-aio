interface CexKeys {
  api_key: string
  api_secret: string
  password?: string
}

interface CexKeysWithPassword extends CexKeys {
  password: string
}

export { CexKeys, CexKeysWithPassword }
