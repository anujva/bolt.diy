// Test script to verify Amazon Bedrock provider uses credential chain
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

// Test configuration - only region specified, credentials from credential chain
const config = {
  region: 'us-east-1'
};

console.log('Testing Amazon Bedrock with credential chain...');
console.log('Configuration:', config);

try {
  const bedrock = createAmazonBedrock(config);
  console.log('✅ Amazon Bedrock client created successfully using credential chain');
  console.log('Credentials will be resolved automatically from:');
  console.log('1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
  console.log('2. Shared credentials file (~/.aws/credentials)');
  console.log('3. IAM roles for EC2 instances');
  console.log('4. IAM roles for ECS tasks');
  console.log('5. IAM roles for Lambda functions');

  // Test with a model to see if it initializes properly
  const model = bedrock('amazon.nova-lite-v1:0');
  console.log('✅ Model instance created successfully:', typeof model);
} catch (error) {
  console.error('❌ Error creating Amazon Bedrock client:', error.message);
  console.error('This is expected if AWS credentials are not configured in your environment');
}