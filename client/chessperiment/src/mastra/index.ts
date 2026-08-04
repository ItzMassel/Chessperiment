import { Mastra } from '@mastra/core/mastra'
import { MastraCompositeStore } from '@mastra/core/storage'
import { DuckDBStore } from '@mastra/duckdb'
import { LibSQLStore } from '@mastra/libsql'
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from '@mastra/observability'
import { ArizeExporter } from '@mastra/arize'
import { editorAgent } from './agents/editor-agent'

const storageExporter = new MastraStorageExporter()
const platformExporter = new MastraPlatformExporter()

export const mastra = new Mastra({
  agents: { editorAgent },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: 'file:./mastra.db',
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    },
  }),
  observability: new Observability({
    configs: {
      development: {
        serviceName: 'mastra-dev',
        exporters: [storageExporter, platformExporter],
        spanOutputProcessors: [new SensitiveDataFilter()],
        logging: {
          enabled: true,
          level: 'info',
        },
      },
      production: {
        serviceName: 'mastra',
        exporters: [
          new ArizeExporter({
            endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT,
            apiKey: process.env.PHOENIX_API_KEY,
          }),
          storageExporter,
          platformExporter,
        ],
      },
    },
    configSelector: () => (process.env.NODE_ENV === 'production' ? 'production' : 'development'),
  }),
})
