export interface LibraryLinkItem {
  title: string;
  url: string;
  description?: string;
  badge?: string;
}

export interface LibraryLinkCategory {
  category: string;
  description?: string;
  items: LibraryLinkItem[];
}

export const LIRC_AFFILIATED_RESOURCES: LibraryLinkCategory[] = [
  {
    category: "LIRC@NU",
    description: "Official Learning & Information Resource Centre documents and services",
    items: [
      { title: "About Us", url: "https://drive.google.com/file/d/1E_JK0f1seibLap_wIduMJQ1ORqVYpgKG/view?usp=sharing", description: "LIRC infrastructure, collection profile, and objectives" },
      { title: "Timings", url: "https://drive.google.com/file/d/1WG0dK1ZCd7hREDDFio909Z51BnCPE55S/view?usp=sharing", description: "Operational hours, reading halls, and circulation desk schedules" },
      { title: "Team", url: "https://drive.google.com/file/d/1C6gt5FsggALo-1J-4vBnIKKKOsWLLZAb/view?usp=sharing", description: "LIRC administrative team and librarians" },
      { title: "General Rules", url: "https://drive.google.com/file/d/1wwh5UK08Sx_zOqmWKcZzfuf64w5S-KI9/view?usp=sharing", description: "Library regulations, borrowing entitlements, and code of conduct" },
      { title: "Annual Reports", url: "https://drive.google.com/drive/folders/1IRh0Yd13eQrczV4yWOpHoG3HAd88aRXq?usp=drive_link", description: "Archived annual development and circulation reports" },
      { title: "LIRC's ICT Initiatives", url: "https://drive.google.com/drive/folders/1_Hho4eR9CtpyOGfxZIL6jAIZ5D5NrqTc", description: "Digital transformation, Koha RFID implementation, and e-learning" },
      { title: "LIRC Manual", url: "https://drive.google.com/file/d/1nXqvyFYATylqZYXRGLy9Uyj_xtATmpnc/view?usp=drive_link", description: "Operational manual and standard library procedures" },
      { title: "Ask Librarian", url: "mailto:Library@niituniversity.in", description: "Direct inquiry email to library helpdesk" },
      { title: "Book Requisition Form", url: "https://niitu-my.sharepoint.com/:x:/g/personal/sandeep_singh_innu_niituniversity_in/EQUBzxinnmxKlsuNHl3dn58BDRLWzXPsYApcM8qv0I4fZA?e=ckG0Jo", description: "Official book purchase proposal form on SharePoint" },
      { title: "LIRC Feedback Form", url: "https://forms.gle/T4iUwFVQtnkWvbwP9", description: "Student suggestions and feedback questionnaire" }
    ]
  },
  {
    category: "Institutional Repository",
    description: "Internal academic assets, faculty publications, and question archives",
    items: [
      { title: "DRNU (Digital Repository NIIT University)", url: "http://172.19.23.3:4000/home", description: "Intranet institutional archive of university publications & dissertations", badge: "Campus Intranet" },
      { title: "Question Paper (Previous Year Question Paper Repository)", url: "https://drive.google.com/drive/folders/15cGAGUEAtDr9XZtdlm9KGIzuLB1yj0nV?usp=sharing", description: "Mid-term and end-term exam question papers across semesters", badge: "Drive Archive" }
    ]
  },
  {
    category: "e-Resources (Books & Databases)",
    description: "Subscribed electronic libraries, indexed full-text journals, and business datasets",
    items: [
      { title: "EBSCO Business Source Premier", url: "https://research.ebsco.com/c/ulrd2d/search", description: "Premier business and management research database" },
      { title: "EBSCO iT Core (e-Books)", url: "https://search.ebscohost.com/", description: "Computer science, IT, and software engineering e-books collection" },
      { title: "Open Access e-Books", url: "https://drive.google.com/file/d/1diJfbPYBHibpvASJLXgmg8S0EEKcDClu/view?usp=sharing", description: "Curated open access textbooks catalog" },
      { title: "Open Access e-Journals", url: "https://drive.google.com/file/d/1NzZGXALxnhFinHqA3Dc_j1-q__toLxby/view?usp=sharing", description: "Directory of peer-reviewed open access periodicals" },
      { title: "JSTOR", url: "https://www.jstor.org/", description: "Digital library of academic journals, books, and primary sources" },
      { title: "CMIE Prowess IQ", url: "https://prowess.cmie.com/", description: "Comprehensive financial database of Indian corporate sector" },
      { title: "IEEE + ASPP + POP + IEEE and MIT eBooks", url: "https://ieeexplore.ieee.org/Xplore/home.jsp", description: "IEEE Xplore digital library for electrical, CSE, and electronics" },
      { title: "Harvard Business School Publishing Case", url: "https://hbsp.harvard.edu", description: "HBSP management case studies (Access active from 1st Week of July 2026)" },
      { title: "Magzter (e-Magazines + e-Newspapers & Books)", url: "https://library.magzter.com/home", description: "Digital newsstand with thousands of national and global periodicals" },
      { title: "Courseware", url: "https://drive.google.com/file/d/13gEK8xCJT8R3cjCMEHCH0Vts2kJsO1OH/view?usp=sharing", description: "Semester curriculum course packs and syllabus reading material" },
      { title: "Educational Technology Innovation Center (ETIC)", url: "https://sites.google.com/st.niituniversity.in/etic-portal/", description: "Pedagogical innovation and digital classroom technologies" },
      { title: "Indian Knowledge System", url: "https://iksindia.org/index.php", description: "National IKS portal for traditional knowledge traditions" },
      { title: "MOOC Portals", url: "https://drive.google.com/file/d/12D1fPu7HCOGkVYKPwSq08Il9uWtmWExQ/view?usp=sharing", description: "Curated online learning and self-paced certification links" },
      { title: "Software Repository", url: "https://drive.google.com/file/d/1NH1-Ri3mjcTBrVb2wcNNfz8EMT1QM0Vj/view?usp=sharing", description: "Academic licensed tools, compilers, and utilities" },
      { title: "South Asia Archive", url: "http://www.southasiaarchive.com/", description: "Historical documents, documents, and journals from South Asia" },
      { title: "Theses & Dissertations", url: "https://drive.google.com/file/d/19YA31L_4cdrQKkW5niXY1PRiWgcLOAC-/view?usp=sharing", description: "Master and Doctoral research theses submitted at NU" }
    ]
  },
  {
    category: "Publication@NU",
    description: "Indexed faculty research outputs, IRINS profile, and discipline publications",
    items: [
      { title: "Publication@Glance (IRINS)", url: "https://niituniversity.irins.org/", description: "Integrated research information management portal for NU faculty" },
      { title: "Engineering Publications", url: "https://niituniversity.in/research/publications/refereed-journals", description: "Refereed engineering and computer science journals" },
      { title: "Humanities & Social Sciences", url: "https://niituniversity.in/research/publications/refereed-journals", description: "Faculty publications in humanities, economics, and communication" },
      { title: "Management Publications", url: "https://niituniversity.in/research/publications/refereed-journals", description: "Business administration, finance, and marketing research papers" },
      { title: "Mathematics & Basic Sciences", url: "https://niituniversity.in/research/publications/refereed-journals", description: "Applied mathematics, physics, and biotechnology publications" }
    ]
  },
  {
    category: "Research Services@LIRC",
    description: "Anti-plagiarism tools, citation managers, and research discovery engines",
    items: [
      { title: "Research Schemes (MoE)", url: "https://www.education.gov.in/en/research_schemes", description: "Ministry of Education academic research grants and schemes" },
      { title: "Articles Request Desk", url: "mailto:library@innu.niituniversity.in", description: "Inter-library loan request for research papers not in direct subscription" },
      { title: "Other Indian ETDs", url: "http://shodhganga.inflibnet.ac.in/newmoredetails/other-indian-etds.html", description: "Electronic theses and dissertations directories in India" },
      { title: "World ETDs", url: "http://shodhganga.inflibnet.ac.in/newmoredetails/abroad-etd-links.html", description: "International theses registries and digital archives" },
      { title: "e-Theses (Shodhganga)", url: "http://shodhganga.inflibnet.ac.in/browse?type=title", description: "Full-text searchable reservoir of Indian doctoral theses" },
      { title: "Scopus", url: "https://www.scopus.com/home.uri", description: "Elsevier's abstract and citation database of peer-reviewed literature" },
      { title: "ORCID", url: "https://orcid.org/", description: "Open Researcher and Contributor ID registry" },
      { title: "QuillBot", url: "https://quillbot.com/grammar-check", description: "Writing refinement and grammar verification tool" },
      { title: "UGC-CARE List", url: "https://ugccare.unipune.ac.in/apps1/home/index", description: "Consortium for Academic and Research Ethics approved journals" },
      { title: "COPE (Committee on Publication Ethics)", url: "https://publicationethics.org/", description: "Guidelines on publication integrity and research ethics" },
      { title: "Publons", url: "https://publons.com/wos-op/account/register/", description: "Track peer review contributions and journal editing citations" },
      { title: "Web of Science (Master Journal List)", url: "https://mjl.clarivate.com/home", description: "Clarivate Analytics master journal database" },
      { title: "Mendeley", url: "https://www.mendeley.com/?interaction_required=true", description: "Reference manager and academic collaboration platform" },
      { title: "Turnitin", url: "https://www.turnitin.com/", description: "Institutional anti-plagiarism and originality checking software" },
      { title: "Literature Search Databases", url: "https://drive.google.com/file/d/1IJ7QHkyHrMFdqRnsiZ6URxJIGINtgmKd/view?usp=sharing", description: "Consolidated literature discovery guide prepared by LIRC" },
      { title: "Sherpa Romeo", url: "https://www.sherpa.ac.uk/romeo/", description: "Publisher copyright and open access self-archiving policies" }
    ]
  },
  {
    category: "LIRC@Remote Access & Networks",
    description: "Off-campus single sign-on access and national academic consortia",
    items: [
      { title: "INFED - Shibboleth (Remote Access)", url: "https://idp.niituniversity.in/", description: "Access campus e-resources seamlessly from home or hostel" },
      { title: "NDL (National Digital Library)", url: "https://ndl.iitkgp.ac.in/", description: "MHRD virtual repository of educational resources across levels" },
      { title: "DELNET Discovery Portal", url: "https://discovery.delnet.in", description: "Developing Library Network inter-library loan and resource sharing" },
      { title: "e-ShodhSindhu", url: "https://ess.inflibnet.ac.in/", description: "Consortium for Higher Education Electronic Resources" },
      { title: "Shodhganga", url: "https://shodhganga.inflibnet.ac.in/", description: "Reservoir of Indian Theses" },
      { title: "ShodhShuddhi (PDS)", url: "https://shodhshuddhi.inflibnet.ac.in/", description: "National Plagiarism Detection Service" }
    ]
  },
  {
    category: "Special Library & Accessibility",
    description: "Accessible learning materials for visually challenged and specially abled learners",
    items: [
      { title: "Sugamya Pustakalaya", url: "https://library.daisyindia.org/NALP/welcomeLink.action", description: "Online library for people with print disabilities in accessible formats" },
      { title: "Bookshare", url: "https://www.bookshare.org/cms/", description: "E-books in audio, braille, and large print formats" },
      { title: "Disability Knowledge (NDLI)", url: "http://disability.ndl.gov.in/", description: "Specialized knowledge portal on disability resources" }
    ]
  },
  {
    category: "Online Learning & MOOCs",
    description: "Government and premier university online courses and virtual laboratory simulations",
    items: [
      { title: "UGC e-Resources", url: "http://ugceresources.in/index.php", description: "Open education repositories supported by UGC" },
      { title: "SWAYAM Online Courses", url: "https://storage.googleapis.com/uniquecourses/online.html", description: "Credit-eligible national online courses taught by top Indian faculty" },
      { title: "Vidya-Mitra", url: "http://vidyamitra.inflibnet.ac.in/", description: "Integrated e-content portal developed by INFLIBNET Centre" },
      { title: "SWAYAM PRABHA", url: "https://swayamprabha.gov.in/", description: "34 DTH channels devoted to telecasting high quality educational programs" },
      { title: "ICSSR Data Service", url: "http://www.icssrdataservice.in/", description: "Social science research datasets repository" },
      { title: "NPTEL Courses Directory", url: "https://www.classcentral.com/institution/nptel", description: "Catalogue of engineering and technology certifications" },
      { title: "NPTEL Portal", url: "https://nptel.ac.in/", description: "Official IIT/IISc video lecture repository and certification exams" },
      { title: "Virtual Labs", url: "https://www.vlab.co.in/", description: "Interactive remote laboratory simulations for engineering courses" },
      { title: "Spoken Tutorial", url: "https://spoken-tutorial.org/", description: "Software tutorials created by IIT Bombay" }
    ]
  },
  {
    category: "NU@INFLIBNET & Parliament Library",
    description: "Institutional portals and access to parliamentary digital records",
    items: [
      { title: "ILMS (NU Identity Provider)", url: "https://idp.niituniversity.in/ilms_niit/", description: "Integrated Library Management System authentication node" },
      { title: "Vidwan Database", url: "https://vidwan.inflibnet.ac.in/", description: "Premier database of Indian scientists and researchers" },
      { title: "IRINS Portal", url: "https://niituniversity.irins.org/", description: "Research Information Network System of NIIT University" },
      { title: "Parliament Digital Library", url: "https://eparlib.nic.in/", description: "Digitized debates, committee reports, and historical parliamentary acts" },
      { title: "Parliament Library Access Pass", url: "https://parlibindiaentrypass.nic.in/", description: "Digital entry pass portal for academic research visits to Parliament Library" }
    ]
  },
  {
    category: "Social Media@NU",
    description: "Official social media channels for university updates and campus events",
    items: [
      { title: "YouTube", url: "https://www.youtube.com/@niituniv/featured", description: "Campus tours, lectures, and convocation broadcasts" },
      { title: "Facebook", url: "https://www.facebook.com/NIITUniv", description: "Official community announcements and celebrations" },
      { title: "Twitter / X", url: "https://twitter.com/niituniversity", description: "Real-time notices and press announcements" },
      { title: "Instagram", url: "https://www.instagram.com/niituniv/", description: "Student campus life, cultural fest, and photography" },
      { title: "LinkedIn", url: "https://www.linkedin.com/school/niit-university/", description: "Career placements, alumni achievements, and institutional news" }
    ]
  }
];
