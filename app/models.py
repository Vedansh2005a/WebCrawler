from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ScrapeRequest(BaseModel):
    country: str = "India"
    state: str = ""
    city: str
    category: str = "Digital Marketing"
    limit: int = Field(default=25, ge=1)
    phone_required: bool = False
    phone_only: bool = False


class Lead(BaseModel):
    company_name: str
    sector: str = "Digital Marketing"
    city: str = ""
    state: str = ""
    locality: str = ""
    website: str = ""
    phone: str = ""
    has_phone: bool = False
    phone_type: str = "none"
    email: str = ""
    contact_person: str = ""
    contact_role: str = ""
    company_size: str = ""
    company_age: str = ""
    industry_subcategory: str = ""
    services: List[str] = []
    location_type: str = "unverified"
    source: str = "Public Web Discovery"
    contact_validation: str = ""
    verification_status: str = "verified"
    lead_quality_score: int = Field(default=0, ge=0, le=100)
    score_reason: str = ""
    evidence: List[str] = []


class ScrapeResponse(BaseModel):
    requested_city: str
    requested_category: str
    discovered: int
    qualified: int
    leads_with_phone: int = 0
    phone_required: bool = False
    duration_seconds: float = 0.0
    leads: List[Lead]
    discovery_data: List[Dict[str, Any]] = []
    discovery_records: List[Dict[str, Any]] = []
    csv_file: str
    phone_leads_csv_file: str = ""
    discovery_csv_file: str = ""
    master_excel_file: str = ""


# =========================================================================
# CRM Integration Models
# =========================================================================

class CRMDestinationCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, description="Customer or organization name")
    crm_type: str = Field(default="webhook", description="Target CRM protocol: 'webhook', 'generic_rest', 'hubspot', 'zoho'")
    target_url: str = Field(..., min_length=4, description="Customer CRM endpoint or webhook URL")
    api_key: Optional[str] = Field(default="", description="Optional bearer token or API key")
    city_filter: Optional[str] = Field(default="", description="Target city filter (e.g. 'Delhi', 'Delhi, Mumbai', or '' / '*' for all cities)")
    headers: Optional[Dict[str, str]] = Field(default=None, description="Optional custom HTTP headers")
    field_mapping: Optional[Dict[str, str]] = Field(default=None, description="Optional custom lead field renamings (e.g. {'company_name': 'name'})")
    auto_sync: bool = Field(default=True, description="Whether to automatically push leads whenever a scraper run finishes for this city")
    is_active: bool = Field(default=True, description="Whether this integration is enabled")


class CRMDestinationUpdate(BaseModel):
    customer_name: Optional[str] = None
    crm_type: Optional[str] = None
    target_url: Optional[str] = None
    api_key: Optional[str] = None
    city_filter: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    field_mapping: Optional[Dict[str, str]] = None
    auto_sync: Optional[bool] = None
    is_active: Optional[bool] = None


class CRMDestinationResponse(BaseModel):
    destination_id: str
    customer_name: str
    crm_type: str
    target_url: str
    has_api_key: bool = False
    city_filter: str = ""
    headers: Dict[str, str] = Field(default_factory=dict)
    field_mapping: Dict[str, str] = Field(default_factory=dict)
    auto_sync: bool = True
    is_active: bool = True
    created_at: str
    updated_at: str


class CRMExportRequest(BaseModel):
    city: str = Field(..., min_length=1, description="Target city to export leads for")
    destination_id: Optional[str] = Field(default=None, description="ID of pre-registered customer CRM destination")
    export_all_matched: bool = Field(default=False, description="If true, exports to all active destinations matching this city")
    # One-off dynamic export options (if destination_id is not provided):
    target_url: Optional[str] = Field(default=None, description="One-off destination endpoint or webhook URL")
    crm_type: str = Field(default="webhook", description="Target CRM protocol for one-off export")
    api_key: Optional[str] = Field(default="", description="Optional API key for one-off export")
    headers: Optional[Dict[str, str]] = Field(default=None, description="Optional custom headers for one-off export")
    field_mapping: Optional[Dict[str, str]] = Field(default=None, description="Optional custom field mapping")
    # Filters
    limit: int = Field(default=100, ge=1, le=5000, description="Max leads to export")
    phone_only: bool = Field(default=False, description="Whether to export only leads with a verified phone number")
    category: Optional[str] = Field(default="", description="Optional category filter (e.g. 'Digital Marketing')")


class CRMExportResult(BaseModel):
    success: bool
    destination_id: Optional[str] = None
    customer_name: Optional[str] = None
    crm_type: str = "webhook"
    target_url: str = ""
    city: str
    leads_count: int
    status_code: Optional[int] = None
    response_summary: Optional[str] = None
    error: Optional[str] = None
    timestamp: str


class CRMTestConnectionRequest(BaseModel):
    target_url: str = Field(..., min_length=4)
    crm_type: str = Field(default="webhook")
    api_key: Optional[str] = ""
    headers: Optional[Dict[str, str]] = None

