import { useEffect, useMemo, useState } from 'react'
import type { Avis, AvisDraft, AuthSession } from '../types'
import { createAvis, updateAvis } from '../services/api'
import { useQuartierNames, useUniversites } from '../hooks/useUniversites'
import { UiIcon } from './UiIcons'
import type { ToastDraft } from './ToastViewport'

interface AvisFormModalProps {
  isOpen: boolean
  onClose: () => void
  session: AuthSession
  initial?: Avis | null
  onSaved: (avis: Avis) => void
  onToast: (toast: ToastDraft) => void
}

const ROOM_TYPE_OPTIONS = [
  { value: 'CHAMBRE_SIMPLE', label: 'Chambre simple' },
  { value: 'CHAMBRE_SALON', label: 'Chambre salon' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'APPARTEMENT', label: 'Appartement / 2 pieces' },
  { value: 'PLACE_COLOCATION', label: 'Place en colocation' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  fontSize: 13.5,
  color: '#0f172a',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 800,
  color: '#475569',
  marginBottom: 7,
}

export function AvisFormModal({ isOpen, onClose, session, initial, onSaved, onToast }: AvisFormModalProps) {
  const { universities } = useUniversites()

  const [universiteId, setUniversiteId] = useState('')
  const [quartier, setQuartier] = useState('')
  const [typeChambre, setTypeChambre] = useState('CHAMBRE_SIMPLE')
  const [nombrePlaces, setNombrePlaces] = useState('1')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [dateSouhaitee, setDateSouhaitee] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const profileUniversiteId = session.user.profil?.universite_id

    setUniversiteId(
      initial?.universite_id
        ? String(initial.universite_id)
        : profileUniversiteId
          ? String(profileUniversiteId)
          : ''
    )
    setQuartier(initial?.quartier ?? '')
    setTypeChambre(initial?.type_chambre ?? 'CHAMBRE_SIMPLE')
    setNombrePlaces(initial?.nombre_places ? String(initial.nombre_places) : '1')
    setBudgetMin(initial?.budget_min ? String(initial.budget_min) : '')
    setBudgetMax(initial?.budget_max ? String(initial.budget_max) : '')
    setDateSouhaitee(initial?.date_souhaitee ?? '')
    setDescription(initial?.description ?? '')
    setError(null)
  }, [isOpen, initial, session.user.profil?.universite_id])

  const selectedUniversite = useMemo(
    () => universities.find((universite) => String(universite.id) === universiteId),
    [universities, universiteId]
  )

  const quartierNames = useQuartierNames(selectedUniversite?.code, universiteId || undefined)

  if (!isOpen) return null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!quartier.trim()) {
      setError('Indiquez le quartier ou la zone que vous recherchez.')
      return
    }

    const max = Number(budgetMax)
    if (!max || max <= 0) {
      setError('Indiquez votre budget maximum par mois.')
      return
    }

    const min = budgetMin ? Number(budgetMin) : undefined
    if (min !== undefined && min > max) {
      setError('Le budget minimum ne peut pas depasser le budget maximum.')
      return
    }

    if (description.trim().length < 30) {
      setError('Decrivez votre recherche en au moins 30 caracteres pour aider les demarcheurs.')
      return
    }

    const payload: AvisDraft = {
      universite_id: universiteId || undefined,
      quartier: quartier.trim(),
      type_chambre: typeChambre,
      nombre_places: typeChambre === 'PLACE_COLOCATION' ? nombrePlaces : undefined,
      budget_min: budgetMin || undefined,
      budget_max: max,
      date_souhaitee: dateSouhaitee || undefined,
      description: description.trim(),
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = initial
        ? await updateAvis(session.token, initial.id, { ...payload, statut: initial.statut })
        : await createAvis(session.token, payload)

      onSaved(response.data)
      onToast({
        tone: 'success',
        title: initial ? 'Avis mis a jour' : 'Avis publie',
        message: initial
          ? 'Votre avis est a jour. Les demarcheurs voient les nouvelles informations.'
          : 'Votre avis est en ligne. Les demarcheurs peuvent desormais vous contacter.',
      })
      onClose()
    } catch (err: any) {
      const message = err?.payload?.message || err?.message || "Impossible d'enregistrer votre avis."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal-layer"
      style={{ zIndex: 10000, placeItems: 'center', padding: 16, display: 'grid', position: 'fixed', inset: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avis-form-title"
    >
      <div
        className="modal-backdrop"
        style={{ background: '#0f172a80', border: 0, position: 'absolute', inset: 0, zIndex: 0 }}
        onClick={onClose}
      />
      <div
        className="modal-card"
        style={{
          zIndex: 1,
          borderRadius: 18,
          width: 'min(620px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
          padding: 0,
          background: '#fff',
        }}
      >
        <div
          style={{
            padding: '20px 22px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#f2f7e6',
                color: '#6f8d21',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e4efcf',
              }}
            >
              <UiIcon name="search-user" />
            </div>
            <div>
              <h2 id="avis-form-title" style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {initial ? 'Modifier mon avis' : 'Laisser un avis'}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Je cherche une chambre : decrivez votre besoin, les demarcheurs vous contactent.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <UiIcon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error ? (
            <div style={{ padding: 12, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
              {error}
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle} htmlFor="avis-universite">Universite / campus</label>
              <select
                id="avis-universite"
                value={universiteId}
                onChange={(event) => setUniversiteId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Toutes les universites</option>
                {universities.map((universite) => (
                  <option key={universite.id} value={universite.id}>
                    {universite.code} - {universite.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle} htmlFor="avis-quartier">Quartier / zone recherchee <span style={{ color: '#e11d48' }}>*</span></label>
              <input
                id="avis-quartier"
                type="text"
                list="avis-quartiers"
                value={quartier}
                onChange={(event) => setQuartier(event.target.value)}
                placeholder="Ex : Zogbadjè, Ouando, Zongo..."
                style={inputStyle}
                autoComplete="off"
              />
              <datalist id="avis-quartiers">
                {quartierNames.slice(0, 80).map((nom) => (
                  <option key={nom} value={nom} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div>
              <label style={labelStyle} htmlFor="avis-type">Type de logement</label>
              <select
                id="avis-type"
                value={typeChambre}
                onChange={(event) => setTypeChambre(event.target.value)}
                style={inputStyle}
              >
                {ROOM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {typeChambre === 'PLACE_COLOCATION' ? (
              <div>
                <label style={labelStyle} htmlFor="avis-places">Nombre de places</label>
                <input
                  id="avis-places"
                  type="number"
                  min={1}
                  max={20}
                  value={nombrePlaces}
                  onChange={(event) => setNombrePlaces(event.target.value)}
                  style={inputStyle}
                />
              </div>
            ) : (
              <div>
                <label style={labelStyle} htmlFor="avis-date">Date d'emménagement souhaitee</label>
                <input
                  id="avis-date"
                  type="date"
                  value={dateSouhaitee}
                  onChange={(event) => setDateSouhaitee(event.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {typeChambre === 'PLACE_COLOCATION' ? (
            <div>
              <label style={labelStyle} htmlFor="avis-date-coloc">Date d'emménagement souhaitee</label>
              <input
                id="avis-date-coloc"
                type="date"
                value={dateSouhaitee}
                onChange={(event) => setDateSouhaitee(event.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle} htmlFor="avis-budget-min">Budget minimum (FCFA / mois)</label>
              <input
                id="avis-budget-min"
                type="number"
                min={0}
                max={100000000}
                step={1000}
                value={budgetMin}
                onChange={(event) => setBudgetMin(event.target.value)}
                placeholder="Ex : 20000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="avis-budget-max">Budget maximum (FCFA / mois) <span style={{ color: '#e11d48' }}>*</span></label>
              <input
                id="avis-budget-max"
                type="number"
                min={0}
                max={100000000}
                step={1000}
                value={budgetMax}
                onChange={(event) => setBudgetMax(event.target.value)}
                placeholder="Ex : 40000"
                style={inputStyle}
                required
              />
            </div>
          </div>

          <div>
            <label style={labelStyle} htmlFor="avis-description">
              Votre recherche en detail <span style={{ color: '#e11d48' }}>*</span>
            </label>
            <textarea
              id="avis-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              minLength={30}
              maxLength={3000}
              placeholder="Ex : Je suis etudiante en L3 a la FSA. Je cherche une chambre salon calme, avec eau courante et compteur SBEE, proche du campus. Disponible pour une visite cette semaine."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: description.trim().length < 30 ? '#b45309' : '#94a3b8' }}>
              <span>30 caracteres minimum.</span>
              <span>{description.trim().length}/3000</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 12,
              borderRadius: 12,
              background: '#f0fdf4',
              border: '1px solid #dcfce7',
              fontSize: 12,
              color: '#166534',
              lineHeight: 1.5,
            }}
          >
            <span style={{ display: 'inline-flex', marginTop: 1, color: '#16a34a' }}>
              <UiIcon name="shield-check" />
            </span>
            <span>
              Votre nom et votre photo peuvent apparaitre sur l'avis, mais <strong>votre telephone et votre email restent prives</strong>.
              Les demarcheurs vous contactent uniquement via la messagerie securisee ColoCampus.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700, cursor: 'pointer', color: '#334155' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="filled-button"
              style={{ border: 'none', padding: '11px 22px', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.75 : 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              {isSubmitting ? 'Enregistrement...' : initial ? 'Enregistrer' : 'Publier mon avis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
