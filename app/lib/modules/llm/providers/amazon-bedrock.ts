import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { LanguageModelV1 } from 'ai';
import type { IProviderSetting } from '~/types/model';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

interface AWSBedRockConfig {
  region: string;

  /*
   * Credentials will be resolved automatically via credential chain
   * No need to explicitly pass accessKeyId, secretAccessKey, sessionToken
   */
}

export default class AmazonBedrockProvider extends BaseProvider {
  name = 'AmazonBedrock';
  getApiKeyLink = 'https://console.aws.amazon.com/iam/home';

  config = {
    apiTokenKey: 'AWS_BEDROCK_CONFIG',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
      label: 'Claude 4 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'us.anthropic.claude-opus-4-20250514-v1:0',
      label: 'Claude 4 Opus (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      label: 'Claude 3.7 Sonnet v1 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      label: 'Claude 3.5 Sonnet v2 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 200000,
    },
    {
      name: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
      label: 'Claude 3.5 Sonnet (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 4096,
    },
    {
      name: 'amazon.nova-pro-v1:0',
      label: 'Amazon Nova Pro (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 5120,
    },
    {
      name: 'amazon.nova-lite-v1:0',
      label: 'Amazon Nova Lite (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 5120,
    },
    {
      name: 'mistral.mistral-large-2402-v1:0',
      label: 'Mistral Large 24.02 (Bedrock)',
      provider: 'AmazonBedrock',
      maxTokenAllowed: 8192,
    },
  ];

  private _isAWSEnvironment(): boolean {
    return !!(
      process.env.AWS_EXECUTION_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.ECS_CONTAINER_METADATA_URI ||
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.AWS_EC2_METADATA_TOKEN
    );
  }

  private _getRegionFromConfig(apiKey?: string): string {
    if (apiKey) {
      try {
        const parsedConfig = JSON.parse(apiKey);

        if (parsedConfig.region) {
          return parsedConfig.region;
        }
      } catch {
        // If parsing fails, fall back to environment variables
      }
    }

    // Use region from environment variables or default
    return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  }

  getModelInstance(options: {
    model: string;
    serverEnv: any;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'AWS_BEDROCK_CONFIG',
    });

    // Get region from config or environment variables
    const region = this._getRegionFromConfig(apiKey);

    /*
     * Use credential chain - AWS SDK will automatically resolve credentials from:
     * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
     * 2. Shared credentials file (~/.aws/credentials)
     * 3. IAM roles for EC2 instances
     * 4. IAM roles for ECS tasks
     * 5. IAM roles for Lambda functions
     */
    const config: AWSBedRockConfig = {
      region,
    };

    const bedrock = createAmazonBedrock(config);

    return bedrock(model);
  }
}
