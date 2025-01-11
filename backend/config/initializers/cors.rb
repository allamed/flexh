require 'rack/cors'

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'localhost:3002'  # This matches your frontend port
    resource '/api/graphql',
      headers: :any,
      methods: [:post],
      credentials: false,
      expose: ['Authorization']  # Allow Authorization header to be exposed
  end
end
