import sys
import spacy
import json
import nltk
import warnings
warnings.filterwarnings("ignore", message=".*Model 'en_training'.*")
from pyresparser import ResumeParser  # Make sure to import it here
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from nltk.tokenize import word_tokenize
import language_tool_python
import os

# Load spaCy and NLTK for text processing
nlp = spacy.load("en_core_web_sm")
# nltk.download('punkt')

# Function to parse resume and extract key details
def parse_resume(resume_path):
    try:
        # print(f"Attempting to parse resume at {resume_path}")  # Debugging line
        # Try parsing with PyResparser
        resume_data = ResumeParser(resume_path).get_extracted_data()  # Use ResumeParser to parse
        if not resume_data:
            raise ValueError("PyResparser failed to parse the resume.")
        # print(f"Parsed Resume Data: {json.dumps(resume_data, indent=4)}")  # Debugging line
        return resume_data 
    except Exception as e:
        error_message = {"error": f"Resume parsing failed: {str(e)}"}
        print(json.dumps(error_message))  # Ensure error messages are valid JSON     
        return error_message

# Load skill library from a predefined JSON file
def load_skill_library():
    # print("Loading skill library...")  # Debugging line
    skill_library_path = "skill_library.json"
    if not os.path.exists(skill_library_path):
        raise FileNotFoundError("Skill library file not found!")
    with open(skill_library_path, "r") as file:
        skill_library = json.load(file)
    # print(f"Loaded Skill Library: {json.dumps(skill_library, indent=4)}")  # Debugging line
    return skill_library

# Match skills between resume and job description using the skill library
def match_skills(resume_skills, job_skills, skill_library):
    # print(f"Matching skills between: {resume_skills} and {job_skills}")  # Debugging line
    matched_skills = set(resume_skills).intersection(set(job_skills))
    categorized_matches = {category: list(set(matched_skills).intersection(skills)) 
                           for category, skills in skill_library.items()}
    # print(f"Matched Skills: {json.dumps(categorized_matches, indent=4)}")  # Debugging line
    return categorized_matches

# Calculate skill match score using TF-IDF and cosine similarity
def skill_match_tfidf(resume_skills, job_skills):
    # print(f"Calculating skill match score using TF-IDF between resume skills: {resume_skills} and job skills: {job_skills}")  # Debugging line
    vectorizer = TfidfVectorizer().fit_transform([resume_skills, job_skills])
    cosine_sim = cosine_similarity(vectorizer[0:1], vectorizer[1:2])
    score = cosine_sim[0][0] * 100  # Return percentage match
    # print(f"Skill Match TF-IDF Score: {score}")  # Debugging line
    return score

# Grammar check using LanguageTool
def grammar_check(text):
    # print(f"Running grammar check on: {text}")  # Debugging line
    tool = language_tool_python.LanguageTool('en-US')
    matches = tool.check(text)
    errors = [f"{match.ruleId}: {match.message}" for match in matches]
    # print(f"Grammar Errors: {json.dumps(errors, indent=4)}")  # Debugging line
    return errors

# Extract skills from a job description (simple placeholder; refine as needed)
def extract_job_skills(job_description):
    # print(f"Extracting job skills from description: {job_description}")  # Debugging line
    doc = nlp(job_description)
    job_skills = [token.text for token in doc.ents if token.label_ == "SKILL"]
    # print(f"Extracted Job Skills: {job_skills}")  # Debugging line
    return job_skills

# Dynamic ATS scoring system
def calculate_ats_score(resume_data, job_description, scoring_weights=None):
    # print(f"Calculating ATS score...")  # Debugging line
    default_weights = {
        "skills": 50,
        "education": 20,
        "experience": 20,
        "grammar": 10
    }
    weights = scoring_weights or default_weights

    job_skills = extract_job_skills(job_description)
    resume_skills = resume_data.get('skills', [])
    
    # Skill Match
    matched_skills = set(resume_skills).intersection(set(job_skills))
    skill_score = (len(matched_skills) / len(job_skills) * weights["skills"]) if job_skills else 0
    # print(f"Matched Skills: {matched_skills}, Skill Score: {skill_score}")  # Debugging line

    # Education Match
    education = resume_data.get('education', [])
    education_score = weights["education"] if education else 0
    # print(f"Education Match Score: {education_score}")  # Debugging line

    # Experience Match
    experience = resume_data.get('experience', [])
    experience_score = weights["experience"] if experience else 0
    # print(f"Experience Match Score: {experience_score}")  # Debugging line

    # Grammar Quality
    summary = resume_data.get('summary', '')
    grammar_errors = grammar_check(summary)
    grammar_score = weights["grammar"] if len(grammar_errors) < 3 else 0
    # print(f"Grammar Errors: {grammar_errors}, Grammar Score: {grammar_score}")  # Debugging line

    total_score = round(skill_score + education_score + experience_score + grammar_score, 2)
    # print(f"Total ATS Score: {total_score}")  # Debugging line
    return total_score

# Analyze resume and provide detailed feedback
def analyze_resume(resume_path, job_description):
    # print(f"Starting analysis for resume at {resume_path} and job description.")  # Debugging line
    # Parse resume
    resume_data = parse_resume(resume_path)
    if "error" in resume_data:
        return {"error": resume_data["error"]}

    # print(f"Parsed Resume Data: {json.dumps(resume_data, indent=4)}")  # Debugging line
    # Extract skills and job description
    resume_skills = " ".join(resume_data.get('skills', []))  # Join skills as a string
    job_skills = job_description  # Use directly for now; can be preprocessed further
    skill_library = load_skill_library()

    # Skill Match
    skill_match_score_tfidf = skill_match_tfidf(resume_skills, job_skills)
    categorized_matches = match_skills(resume_data.get('skills', []), job_skills.split(), skill_library)

    # Grammar Check
    summary = resume_data.get('summary', '')
    grammar_errors = grammar_check(summary)

    # ATS Scoring
    ats_score = calculate_ats_score(resume_data, job_description)

    # Form the analysis result
    analysis_result = {
        "atsScore": ats_score,
        "matchPercentage": skill_match_score_tfidf,
        "skillsMatch": categorized_matches,
        "recommendations": grammar_errors,
    }
    return analysis_result

# Run the analysis and output result
if __name__ == "__main__":
    try:
        resume_path = sys.argv[1]
        job_description = sys.argv[2]
        result = analyze_resume(resume_path, job_description)
        
        # Print final output
        # print(f"Final output from python file: {json.dumps(result, indent=4)}")  # Optional debug print
        # print(f"Raw data from python file: {result}")  # Optional debug print
        print(json.dumps(result, indent=4))  # Corrected indentation for this line
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))  # Error messages are valid JSON
