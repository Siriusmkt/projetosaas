export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agente_argumentos_dor: {
        Row: {
          agente_id: string | null
          argumento: string
          dor: string
          id: string
          ordem: number | null
          palavras_chave: Json | null
        }
        Insert: {
          agente_id?: string | null
          argumento: string
          dor: string
          id?: string
          ordem?: number | null
          palavras_chave?: Json | null
        }
        Update: {
          agente_id?: string | null
          argumento?: string
          dor?: string
          id?: string
          ordem?: number | null
          palavras_chave?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_diferenciais_por_dor_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_campos_coleta: {
        Row: {
          agente_id: string | null
          campo_descricao: string | null
          campo_nome: string
          id: string
          is_obrigatorio: boolean | null
          ordem: number | null
        }
        Insert: {
          agente_id?: string | null
          campo_descricao?: string | null
          campo_nome: string
          id?: string
          is_obrigatorio?: boolean | null
          ordem?: number | null
        }
        Update: {
          agente_id?: string | null
          campo_descricao?: string | null
          campo_nome?: string
          id?: string
          is_obrigatorio?: boolean | null
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_campos_coleta_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_conectivos: {
        Row: {
          agente_id: string | null
          expressoes: Json
          id: string
          tipo: string
        }
        Insert: {
          agente_id?: string | null
          expressoes?: Json
          id?: string
          tipo: string
        }
        Update: {
          agente_id?: string | null
          expressoes?: Json
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_conectivos_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_criterios_lead: {
        Row: {
          acao_recomendada: string | null
          agente_id: string | null
          criterio: string
          id: string
          is_active: boolean | null
          ordem: number | null
          tipo_lead: string
        }
        Insert: {
          acao_recomendada?: string | null
          agente_id?: string | null
          criterio: string
          id?: string
          is_active?: boolean | null
          ordem?: number | null
          tipo_lead: string
        }
        Update: {
          acao_recomendada?: string | null
          agente_id?: string | null
          criterio?: string
          id?: string
          is_active?: boolean | null
          ordem?: number | null
          tipo_lead?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_criterios_lead_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_empresa: {
        Row: {
          agente_id: string | null
          area_entrega: string | null
          cidade: string | null
          diferenciais: Json | null
          estado: string | null
          id: string
          nome_ceo: string | null
          pais: string | null
          setor: string | null
          sobre_empresa: string | null
          tipo_produto: string
        }
        Insert: {
          agente_id?: string | null
          area_entrega?: string | null
          cidade?: string | null
          diferenciais?: Json | null
          estado?: string | null
          id?: string
          nome_ceo?: string | null
          pais?: string | null
          setor?: string | null
          sobre_empresa?: string | null
          tipo_produto: string
        }
        Update: {
          agente_id?: string | null
          area_entrega?: string | null
          cidade?: string | null
          diferenciais?: Json | null
          estado?: string | null
          id?: string
          nome_ceo?: string | null
          pais?: string | null
          setor?: string | null
          sobre_empresa?: string | null
          tipo_produto?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_institucional_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: true
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_faq: {
        Row: {
          agente_id: string | null
          id: string
          ordem: number | null
          palavras_chave: Json | null
          resposta: string
          topico: string
        }
        Insert: {
          agente_id?: string | null
          id?: string
          ordem?: number | null
          palavras_chave?: Json | null
          resposta: string
          topico: string
        }
        Update: {
          agente_id?: string | null
          id?: string
          ordem?: number | null
          palavras_chave?: Json | null
          resposta?: string
          topico?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_faq_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_fluxo_etapas: {
        Row: {
          agente_id: string | null
          campo_coleta: string | null
          contexto_gatilho: string | null
          id: string
          instrucoes_adicionais: string | null
          nome: string
          numero: number
          ordem: number | null
          pergunta_principal: string
          respostas_condicionais: Json | null
          variacoes: Json | null
        }
        Insert: {
          agente_id?: string | null
          campo_coleta?: string | null
          contexto_gatilho?: string | null
          id?: string
          instrucoes_adicionais?: string | null
          nome: string
          numero: number
          ordem?: number | null
          pergunta_principal: string
          respostas_condicionais?: Json | null
          variacoes?: Json | null
        }
        Update: {
          agente_id?: string | null
          campo_coleta?: string | null
          contexto_gatilho?: string | null
          id?: string
          instrucoes_adicionais?: string | null
          nome?: string
          numero?: number
          ordem?: number | null
          pergunta_principal?: string
          respostas_condicionais?: Json | null
          variacoes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_fluxo_qualificacao_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_gatilhos: {
        Row: {
          acao: string
          agente_id: string | null
          frase_gatilho: string
          id: string
          ordem: number | null
          tipo: string
        }
        Insert: {
          acao: string
          agente_id?: string | null
          frase_gatilho: string
          id?: string
          ordem?: number | null
          tipo: string
        }
        Update: {
          acao?: string
          agente_id?: string | null
          frase_gatilho?: string
          id?: string
          ordem?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_gatilhos_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_identidade: {
        Row: {
          agente_id: string | null
          empresa_nome: string
          empresa_nome_curto: string | null
          funcao: string
          genero: string | null
          id: string
          nome_ia: string
          personalidade: string | null
          setor: string
        }
        Insert: {
          agente_id?: string | null
          empresa_nome: string
          empresa_nome_curto?: string | null
          funcao: string
          genero?: string | null
          id?: string
          nome_ia: string
          personalidade?: string | null
          setor: string
        }
        Update: {
          agente_id?: string | null
          empresa_nome?: string
          empresa_nome_curto?: string | null
          funcao?: string
          genero?: string | null
          id?: string
          nome_ia?: string
          personalidade?: string | null
          setor?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_identidade_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: true
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_objecoes: {
        Row: {
          agente_id: string | null
          estrategia: string | null
          id: string
          objecao_gatilho: string
          ordem: number | null
          resposta: string
        }
        Insert: {
          agente_id?: string | null
          estrategia?: string | null
          id?: string
          objecao_gatilho: string
          ordem?: number | null
          resposta: string
        }
        Update: {
          agente_id?: string | null
          estrategia?: string | null
          id?: string
          objecao_gatilho?: string
          ordem?: number | null
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_objecoes_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_pronuncia: {
        Row: {
          agente_id: string | null
          exemplo: string | null
          id: string
          pronuncia: string
          simbolo: string
        }
        Insert: {
          agente_id?: string | null
          exemplo?: string | null
          id?: string
          pronuncia: string
          simbolo: string
        }
        Update: {
          agente_id?: string | null
          exemplo?: string | null
          id?: string
          pronuncia?: string
          simbolo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_pronuncia_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_regras: {
        Row: {
          agente_id: string | null
          id: string
          is_active: boolean | null
          ordem: number | null
          regra_descricao: string | null
          regra_key: string
          regra_nome: string
        }
        Insert: {
          agente_id?: string | null
          id?: string
          is_active?: boolean | null
          ordem?: number | null
          regra_descricao?: string | null
          regra_key: string
          regra_nome: string
        }
        Update: {
          agente_id?: string | null
          id?: string
          is_active?: boolean | null
          ordem?: number | null
          regra_descricao?: string | null
          regra_key?: string
          regra_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_regras_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_scripts: {
        Row: {
          agente_id: string | null
          conteudo: string
          contexto: string
          id: string
          instrucao_uso: string | null
          ordem: number | null
          script_key: string
        }
        Insert: {
          agente_id?: string | null
          conteudo: string
          contexto: string
          id?: string
          instrucao_uso?: string | null
          ordem?: number | null
          script_key: string
        }
        Update: {
          agente_id?: string | null
          conteudo?: string
          contexto?: string
          id?: string
          instrucao_uso?: string | null
          ordem?: number | null
          script_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_scripts_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agente_voz_config: {
        Row: {
          agente_id: string | null
          concordancia: Json | null
          confirmacoes: Json | null
          detectar_interrupcao: boolean | null
          empatia: Json | null
          id: string
          instrucoes_adicionais: string | null
          max_perguntas_seguidas: number | null
          nivel_formalidade: string | null
          pausas_naturais: boolean | null
          posicionamento: string | null
          proporcao_fala_escuta: string | null
          tempo_espera_resposta: number | null
          transicoes: Json | null
          usa_emojis: boolean | null
          usa_girias: boolean | null
          velocidade_fala: string | null
        }
        Insert: {
          agente_id?: string | null
          concordancia?: Json | null
          confirmacoes?: Json | null
          detectar_interrupcao?: boolean | null
          empatia?: Json | null
          id?: string
          instrucoes_adicionais?: string | null
          max_perguntas_seguidas?: number | null
          nivel_formalidade?: string | null
          pausas_naturais?: boolean | null
          posicionamento?: string | null
          proporcao_fala_escuta?: string | null
          tempo_espera_resposta?: number | null
          transicoes?: Json | null
          usa_emojis?: boolean | null
          usa_girias?: boolean | null
          velocidade_fala?: string | null
        }
        Update: {
          agente_id?: string | null
          concordancia?: Json | null
          confirmacoes?: Json | null
          detectar_interrupcao?: boolean | null
          empatia?: Json | null
          id?: string
          instrucoes_adicionais?: string | null
          max_perguntas_seguidas?: number | null
          nivel_formalidade?: string | null
          pausas_naturais?: boolean | null
          posicionamento?: string | null
          proporcao_fala_escuta?: string | null
          tempo_espera_resposta?: number | null
          transicoes?: Json | null
          usa_emojis?: boolean | null
          usa_girias?: boolean | null
          velocidade_fala?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_tom_prompt_id_fkey"
            columns: ["agente_id"]
            isOneToOne: true
            referencedRelation: "agentes"
            referencedColumns: ["id"]
          },
        ]
      }
      agentes: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assistant_tools: {
        Row: {
          ai_description: string
          config: Json | null
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          parameters: Json | null
          tenant_id: string
          tool_name: string
          tool_type: Database["public"]["Enums"]["tool_type"]
          updated_at: string | null
        }
        Insert: {
          ai_description: string
          config?: Json | null
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          parameters?: Json | null
          tenant_id: string
          tool_name: string
          tool_type: Database["public"]["Enums"]["tool_type"]
          updated_at?: string | null
        }
        Update: {
          ai_description?: string
          config?: Json | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          parameters?: Json | null
          tenant_id?: string
          tool_name?: string
          tool_type?: Database["public"]["Enums"]["tool_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      flow_blocks: {
        Row: {
          analyze_variable: string | null
          assistente_id: string | null
          block_key: string
          block_type: string
          content: string
          created_at: string | null
          end_metadata: Json | null
          end_type: string | null
          flow_id: string
          id: string
          next_block_key: string | null
          order_index: number | null
          position_x: number | null
          position_y: number | null
          routes_data: Json | null
          tenant_id: string | null
          timeout_seconds: number | null
          tool_config: Json | null
          tool_type: string | null
          updated_at: string | null
          variable_name: string | null
        }
        Insert: {
          analyze_variable?: string | null
          assistente_id?: string | null
          block_key: string
          block_type: string
          content: string
          created_at?: string | null
          end_metadata?: Json | null
          end_type?: string | null
          flow_id: string
          id?: string
          next_block_key?: string | null
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
          routes_data?: Json | null
          tenant_id?: string | null
          timeout_seconds?: number | null
          tool_config?: Json | null
          tool_type?: string | null
          updated_at?: string | null
          variable_name?: string | null
        }
        Update: {
          analyze_variable?: string | null
          assistente_id?: string | null
          block_key?: string
          block_type?: string
          content?: string
          created_at?: string | null
          end_metadata?: Json | null
          end_type?: string | null
          flow_id?: string
          id?: string
          next_block_key?: string | null
          order_index?: number | null
          position_x?: number | null
          position_y?: number | null
          routes_data?: Json | null
          tenant_id?: string | null
          timeout_seconds?: number | null
          tool_config?: Json | null
          tool_type?: string | null
          updated_at?: string | null
          variable_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_blocks_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_routes: {
        Row: {
          assistente_id: string | null
          block_id: string
          cor: string | null
          created_at: string | null
          destination_block_key: string | null
          destination_type: string | null
          flow_id: string
          id: string
          is_fallback: boolean | null
          keywords: string[] | null
          label: string
          max_loop_attempts: number | null
          ordem: number | null
          response: string | null
          route_key: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          assistente_id?: string | null
          block_id: string
          cor?: string | null
          created_at?: string | null
          destination_block_key?: string | null
          destination_type?: string | null
          flow_id: string
          id?: string
          is_fallback?: boolean | null
          keywords?: string[] | null
          label: string
          max_loop_attempts?: number | null
          ordem?: number | null
          response?: string | null
          route_key: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assistente_id?: string | null
          block_id?: string
          cor?: string | null
          created_at?: string | null
          destination_block_key?: string | null
          destination_type?: string | null
          flow_id?: string
          id?: string
          is_fallback?: boolean | null
          keywords?: string[] | null
          label?: string
          max_loop_attempts?: number | null
          ordem?: number | null
          response?: string | null
          route_key?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_routes_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "flow_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flow_routes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "flows"
            referencedColumns: ["id"]
          },
        ]
      }
      flows: {
        Row: {
          assistente_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          prompt_base: string | null
          published_at: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          assistente_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          prompt_base?: string | null
          published_at?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          assistente_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          prompt_base?: string | null
          published_at?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      tool_assets: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          thumbnail_url: string | null
          tool_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          thumbnail_url?: string | null
          tool_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          thumbnail_url?: string | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_assets_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "assistant_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_assignments: {
        Row: {
          assistant_id: string
          created_at: string | null
          custom_config: Json | null
          id: string
          is_enabled: boolean | null
          tool_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_enabled?: boolean | null
          tool_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string | null
          custom_config?: Json | null
          id?: string
          is_enabled?: boolean | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_assignments_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "assistant_tools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_flow_owner_v2: { Args: { _flow_id: string }; Returns: boolean }
      is_tool_owner: { Args: { _tool_id: string }; Returns: boolean }
    }
    Enums: {
      tool_type:
        | "video"
        | "imagem"
        | "audio"
        | "arquivo"
        | "agendamento"
        | "transferencia"
        | "link"
        | "webhook"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tool_type: [
        "video",
        "imagem",
        "audio",
        "arquivo",
        "agendamento",
        "transferencia",
        "link",
        "webhook",
      ],
    },
  },
} as const
