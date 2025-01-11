require 'http'

class Api::GraphqlController < ApplicationController
  skip_before_action :verify_authenticity_token

  def proxy
    # Extract and log the incoming API key header
    api_key = request.headers['FLEXHIRE-API-KEY']
    
    Rails.logger.info "Incoming API key: #{api_key}"

    begin
      # Construct the headers for Flexhire
      headers = {
        'Content-Type' => 'application/json',
        'FLEXHIRE-API-KEY' => api_key
      }
      
      Rails.logger.info "Outgoing headers: #{headers.inspect}"
      Rails.logger.info "Request body: #{request.body.read}"

      # Make the request to Flexhire
      response = HTTP
        .headers(headers)
        .post(
          'https://flexhire.com/api/v2',
          json: {
            query: params[:query],
            variables: params[:variables] || {}
          }
        )

      Rails.logger.info "Flexhire response status: #{response.status}"
      Rails.logger.info "Flexhire response body: #{response.body.to_s}"

      render json: response.body.to_s, status: response.status
    rescue => e
      Rails.logger.error "GraphQL Proxy Error: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { errors: [{ message: e.message }] }, status: :internal_server_error
    end
  end
end 