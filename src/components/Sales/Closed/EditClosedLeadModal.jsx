import React, { useState, useEffect, useMemo } from "react";
import { doc, updateDoc, getDoc, setDoc, deleteDoc, query, where, getDocs, collection } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  FiX,
  FiChevronDown,
  FiInfo,
  FiDollarSign,
  FiPercent,
  FiUser,
  FiPhone,
  FiCreditCard,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

const EditClosedLeadModal = ({ lead, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    businessName: "",
    projectCode: "",
    city: "",
    state: "",
    totalCost: 0,
    tcv: 0,
    perStudentCost: 0,
    studentCount: 0,
    gstAmount: 0,
    netPayableAmount: 0,
    gstNumber: "",
    gstType: "include",
    course: "",
    courses: [{ specialization: "", students: 0, othersSpecText: "" }],
    year: "",
    deliveryType: "",
    passingYear: "",
    tpoName: "",
    tpoEmail: "",
    tpoPhone: "",
    trainingName: "",
    trainingEmail: "",
    trainingPhone: "",
    accountName: "",
    accountEmail: "",
    accountPhone: "",
    contractStartDate: "",
    contractEndDate: "",
    paymentType: "",
    paymentDetails: [],
    collegeCode: "",
    collegeName: "",
    address: "",
    pincode: "",
    status: "active",
    topics: [{ topic: "", hours: "" }],
    totalHours: 0,
    studentFileUrl: "",
    mouFileUrl: "",
    otherCourseText: "",
    isCustomCourse: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("basic");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [topicErrors, setTopicErrors] = useState([]);
  const [paymentErrors, setPaymentErrors] = useState([]);
  const [isCustomDeliveryType, setIsCustomDeliveryType] = useState(false);
  const sections = ["basic", "contacts", "course", "topics", "financial"];

// Helper for number display
const numValue = (val) => (val === 0 || val === "0" ? "" : val);

// Helper for Indian number formatting
const formatIndianNumber = (num, decimals = 2) => {
  if (num === 0 || num === "0" || !num) return "0.00";
  const number = parseFloat(num);
  if (isNaN(number)) return num;
  
  const [integerPart, decimalPart] = number.toFixed(decimals).split('.');
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  
  let formattedInteger = lastThree;
  if (otherNumbers !== '') {
    formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }
  
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

  const courseSpecializations = useMemo(() => ({
    Engineering: [
      "CS",
      "IT",
      "ENTC",
      "CS-Cyber Security",
      "Mechanical",
      "Civil",
      "Electrical",
      "Chemical",
      "CS-AI-ML",
      "CS-AI-DS",
      "Other",
    ],
    MBA: ["Marketing", "Finance", "HR", "Operations", "Other"],
    BBA: ["International Business", "General", "Finance", "Other"],
    BCA: ["Computer Applications", "Other"],
    MCA: ["Computer Science", "Other"],
    Diploma: ["Mechanical", "Civil", "Electrical", "Computer", "Other"],
    BSC: ["Physics", "Chemistry", "Mathematics", "CS", "Other"],
    MSC: ["Physics", "Chemistry", "Mathematics", "CS", "Other"],
    Others: ["Other"],
  }), []);

  const topicOptions = [
    "Soft Skills",
    "Aptitude",
    "Domain Technical",
    "Excel - Power BI",
    "Looker Studio",
  ];

  useEffect(() => {
    if (lead) {
      const deliveryTypes = ["TP", "OT", "IP", "DM", "SNS"];
      setIsCustomDeliveryType(lead.deliveryType && !deliveryTypes.includes(lead.deliveryType));

      // Normalize courses: if the stored specialization is not one of the predefined
      // options for the course, treat it as "Other" and populate othersSpecText with the stored value
      const normalizedCourses = (lead.courses || [
        { specialization: "", students: 0, othersSpecText: "" },
      ]).map((c) => {
        const origSpec = (c.specialization || "").toString();
        const specsForCourse = courseSpecializations[lead.course] || [];

        // If course has predefined specs and origSpec is not one of them -> show as Other + preserve text
        if (specsForCourse.length > 0 && origSpec && !specsForCourse.includes(origSpec)) {
          return {
            ...c,
            specialization: "Other",
            othersSpecText: origSpec,
            students: c.students || 0,
          };
        }

        // If stored as "Other" and there is an othersSpecText, preserve it
        if (origSpec === "Other" && c.othersSpecText) {
          return {
            ...c,
            specialization: "Other",
            othersSpecText: c.othersSpecText,
            students: c.students || 0,
          };
        }

        // Normal case: keep stored specialization, clear othersSpecText
        return {
          ...c,
          specialization: origSpec,
          othersSpecText: c.othersSpecText || "",
          students: c.students || 0,
        };
      });

      setFormData({
        businessName: lead.businessName || "",
        projectCode: lead.projectCode || "",
        city: lead.city || "",
        state: lead.state || "",
        totalCost: parseFloat(lead.totalCost) || 0,
        tcv: parseFloat(lead.tcv) || 0,
        perStudentCost: parseFloat(lead.perStudentCost) || 0,
        studentCount: parseInt(lead.studentCount) || 0,
        gstAmount: parseFloat(lead.gstAmount) || 0,
        netPayableAmount: parseFloat(lead.netPayableAmount) || 0,
        gstNumber: lead.gstNumber || "",
        gstType: lead.gstType || "include",
        course: lead.course || "",
        courses: normalizedCourses,
        year: lead.year || "",
        deliveryType: lead.deliveryType || "",
        passingYear: lead.passingYear || "",
        tpoName: lead.tpoName || "",
        tpoEmail: lead.tpoEmail || "",
        tpoPhone: lead.tpoPhone || "",
        trainingName: lead.trainingName || "",
        trainingEmail: lead.trainingEmail || "",
        trainingPhone: lead.trainingPhone || "",
        accountName: lead.accountName || "",
        accountEmail: lead.accountEmail || "",
        accountPhone: lead.accountPhone || "",
        contractStartDate: lead.contractStartDate || "",
        contractEndDate: lead.contractEndDate || "",
        paymentType: lead.paymentType || "",
        paymentDetails: lead.paymentDetails || [],
        collegeCode: lead.collegeCode || "",
        collegeName: lead.collegeName || lead.businessName || "", // Check collegeName first, then businessName
        address: lead.address || "",
        pincode: lead.pincode || "",
        status: lead.status || "active",
        topics: lead.topics || [
          {
            topic: "",
            hours: "",
          },
        ],
        totalHours: parseInt(lead.totalHours) || 0,
        studentFileUrl: lead.studentFileUrl || "",
        mouFileUrl: lead.mouFileUrl || "",
        otherCourseText: lead.otherCourseText || "", // Add this field for custom courses
        isCustomCourse: !Object.prototype.hasOwnProperty.call(courseSpecializations, lead.course || ""), // Determine if it's a custom course
      });
    }
  }, [lead, courseSpecializations]);



  // 1. Update handleCourseChange to always update studentCount
  const handleCourseChange = (index, field, value) => {
    const updatedCourses = [...formData.courses];
    if (field === "specialization") {
      updatedCourses[index].specialization = value;
      if (value !== "Other") {
        updatedCourses[index].othersSpecText = "";
      }
    } else if (field === "othersSpecText") {
      updatedCourses[index].othersSpecText = value;
    } else {
      updatedCourses[index][field] = field === "students" ? parseInt(value) || 0 : value;
    }
    
    // Always recalculate total students and cost whenever any course field changes
    const totalStudents = updatedCourses.reduce(
      (sum, course) => sum + (parseInt(course.students) || 0),
      0
    );
    const baseAmount = (formData.perStudentCost || 0) * totalStudents;
    const gstAmount = formData.gstType === "include" ? baseAmount * 0.18 : 0;
    const netPayableAmount = baseAmount + gstAmount;

    const newFormData = {
      ...formData,
      courses: updatedCourses,
      studentCount: totalStudents,
      totalCost: baseAmount,
      gstAmount,
      netPayableAmount,
    };

    // Update payment details to match new total
    newFormData.paymentDetails = formData.paymentDetails.map((payment) => ({
      ...payment,
      baseAmount: (parseFloat(payment.percentage) / 100) * baseAmount,
      gstAmount: formData.gstType === "include" ? (parseFloat(payment.percentage) / 100) * gstAmount : 0,
      totalAmount: (parseFloat(payment.percentage) / 100) * netPayableAmount,
    }));

    setFormData(newFormData);
  };

  const handleTopicChange = (index, field, value) => {
    const updatedTopics = [...formData.topics];
    updatedTopics[index][field] = field === "hours" ? parseInt(value) || 0 : value;

    // Calculate new total hours
    const total = updatedTopics.reduce(
      (sum, topic) => sum + (parseInt(topic.hours) || 0),
      0
    );

    // Check for duplicates
    const errors = checkDuplicateTopics(updatedTopics);
    setTopicErrors(errors);

    setFormData((prev) => ({
      ...prev,
      topics: updatedTopics,
      totalHours: total,
    }));
  };

  // Helper to check for duplicates
  const checkDuplicateTopics = (topics) => {
    const errors = [];
    const topicNames = topics.map((t) => t.topic.trim().toLowerCase());
    topics.forEach((t, idx) => {
      if (
        t.topic &&
        topicNames.filter((n) => n === t.topic.trim().toLowerCase()).length > 1
      ) {
        errors[idx] = "This topic already exists.";
      } else {
        errors[idx] = "";
      }
    });
    return errors;
  };

  const addCourse = () => {
    setFormData((prev) => {
      const updatedCourses = [
        ...prev.courses,
        { specialization: "", students: 0, othersSpecText: "" }, // Include othersSpecText
      ];
      
      // Recalculate total students and cost after adding
      const totalStudents = updatedCourses.reduce(
        (sum, course) => sum + (parseInt(course.students) || 0),
        0
      );
      const baseAmount = (prev.perStudentCost || 0) * totalStudents;
      const gstAmount = prev.gstType === "include" ? baseAmount * 0.18 : 0;
      const netPayableAmount = baseAmount + gstAmount;
      
      return {
        ...prev,
        courses: updatedCourses,
        studentCount: totalStudents,
        totalCost: baseAmount,
        gstAmount,
        netPayableAmount,
        // Update payment details to match new total
        paymentDetails: prev.paymentDetails.map((payment) => ({
          ...payment,
          baseAmount: (parseFloat(payment.percentage) / 100) * baseAmount,
          gstAmount: prev.gstType === "include" ? (parseFloat(payment.percentage) / 100) * gstAmount : 0,
          totalAmount: (parseFloat(payment.percentage) / 100) * netPayableAmount,
        })),
      };
    });
  };

  const addTopic = () => {
    const newTopics = [...formData.topics, { topic: "", hours: "" }];
    setFormData((prev) => ({
      ...prev,
      topics: newTopics,
    }));
    setTopicErrors(checkDuplicateTopics(newTopics));
  };

  const removeCourse = (index) => {
    const updatedCourses = [...formData.courses];
    updatedCourses.splice(index, 1);
    
    // Recalculate total students and cost after removal
    const totalStudents = updatedCourses.reduce(
      (sum, course) => sum + (parseInt(course.students) || 0),
      0
    );
    const baseAmount = (formData.perStudentCost || 0) * totalStudents;
    const gstAmount = formData.gstType === "include" ? baseAmount * 0.18 : 0;
    const netPayableAmount = baseAmount + gstAmount;
    
    setFormData((prev) => ({
      ...prev,
      courses: updatedCourses,
      studentCount: totalStudents,
      totalCost: baseAmount,
      gstAmount,
      netPayableAmount,
      // Update payment details to match new total
      paymentDetails: prev.paymentDetails.map((payment) => ({
        ...payment,
        baseAmount: (parseFloat(payment.percentage) / 100) * baseAmount,
        gstAmount: formData.gstType === "include" ? (parseFloat(payment.percentage) / 100) * gstAmount : 0,
        totalAmount: (parseFloat(payment.percentage) / 100) * netPayableAmount,
      })),
    }));
  };

  const removeTopic = (index) => {
    const updatedTopics = [...formData.topics];
    updatedTopics.splice(index, 1);

    const total = updatedTopics.reduce(
      (sum, topic) => sum + (parseInt(topic.hours) || 0),
      0
    );

    setFormData((prev) => ({
      ...prev,
      topics: updatedTopics,
      totalHours: total,
    }));
    setTopicErrors(checkDuplicateTopics(updatedTopics));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirmation(false);
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.collegeName || formData.collegeName.trim() === "") {
        setError("College Name is required. Please enter a college name before submitting.");
        return;
      }

      const originalProjectCode = lead.projectCode;
      const newProjectCode = formData.projectCode;
      const projectCodeChanged = newProjectCode !== originalProjectCode;

      // Prepare courses for saving (unchanged)
      const coursesForSave = (formData.courses || []).map((c) => {
        const spec = c.specialization === "Other" && c.othersSpecText ? c.othersSpecText : c.specialization;
        return { ...c, specialization: spec, students: parseInt(c.students) || 0 };
      });

      const updatedData = {
        ...formData,
        courses: coursesForSave,
        collegeName: formData.collegeName,
        businessName: formData.collegeName, // Sync both fields
        updatedAt: new Date(),
      };

      if (projectCodeChanged) {
        // Fetch the full original document data
        const oldDocId = projectCodeToDocId(originalProjectCode);
        const oldDocRef = doc(db, "trainingForms", oldDocId);
        const oldDocSnap = await getDoc(oldDocRef);
        if (!oldDocSnap.exists()) {
          setError("Original document not found!");
          return;
        }
        const originalData = oldDocSnap.data();

        // Merge original data with updated data
        const mergedData = {
          ...originalData,
          ...updatedData,
          projectCode: newProjectCode,
          collegeName: formData.collegeName,
          businessName: formData.collegeName, // Sync both fields
        };

        // Delete old document in trainingForms
        await deleteDoc(oldDocRef);

        // Create new document with merged data
        const newDocId = projectCodeToDocId(newProjectCode);
        const newDocRef = doc(db, "trainingForms", newDocId);
        await setDoc(newDocRef, mergedData);

        // 🔄 DUPLICATE ALL SUBCOLLECTIONS from old document to new document
        await duplicateSubcollections(oldDocRef, newDocRef);

        // 🔄 UPDATE TRAINER ASSIGNMENTS - Replace old project code with new project code
        await updateTrainerAssignments(originalProjectCode, newProjectCode);

        // Handle placementData: Fetch old, delete, and create new with merged data
        const oldPlacementRef = doc(db, "placementData", oldDocId);
        const oldPlacementSnap = await getDoc(oldPlacementRef);
        if (oldPlacementSnap.exists()) {
          await deleteDoc(oldPlacementRef);
        }
        const newPlacementRef = doc(db, "placementData", newDocId);
        await setDoc(newPlacementRef, { ...mergedData, projectCode: newProjectCode });

        // Update leads collection with new projectCode
        const leadsQuery = query(collection(db, "leads"), where("projectCode", "==", originalProjectCode));
        const leadsSnapshot = await getDocs(leadsQuery);
        leadsSnapshot.forEach(async (docSnap) => {
          await updateDoc(docSnap.ref, { projectCode: newProjectCode, collegeName: formData.collegeName, businessName: formData.collegeName, totalCost: formData.totalCost, updatedAt: new Date() });
        });
      } else {
        // Normal update if Project Code didn't change
        const leadRef = doc(db, "trainingForms", lead.id);
        await updateDoc(leadRef, updatedData);

        // Update placementData (existing logic)
        const projectDocId = projectCodeToDocId(newProjectCode);
        const trainingFormRef = doc(db, "trainingForms", projectDocId);
        const docSnap = await getDoc(trainingFormRef);
        if (docSnap.exists()) {
          await updateDoc(trainingFormRef, updatedData);
        } else {
          await setDoc(trainingFormRef, updatedData);
        }

        const placementRef = doc(db, "placementData", projectDocId);
        const placementSnap = await getDoc(placementRef);
        if (placementSnap.exists()) {
          await updateDoc(placementRef, updatedData);
        } else {
          await setDoc(placementRef, updatedData);
        }

        // Update leads (existing logic)
        const leadsQuery = query(collection(db, "leads"), where("projectCode", "==", newProjectCode));
        const leadsSnapshot = await getDocs(leadsQuery);
        leadsSnapshot.forEach(async (docSnap) => {
          await updateDoc(docSnap.ref, { collegeName: formData.collegeName, businessName: formData.collegeName, totalCost: formData.totalCost, updatedAt: new Date() });
        });
      }

      onSave();
      onClose();
    } catch (err) {

      setError(err.message || "Failed to update lead. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };
  const projectCodeToDocId = (projectCode) => projectCode.replace(/\//g, "-");

  // Function to update trainerAssignments collection when project code changes
  const updateTrainerAssignments = async (oldProjectCode, newProjectCode) => {
    try {
      console.log(`🔄 Updating trainer assignments: ${oldProjectCode} → ${newProjectCode}`);
      
      // Convert project codes to the format used in document IDs (replace / with -)
      const oldProjectCodeFormatted = oldProjectCode.replace(/\//g, "-");
      const newProjectCodeFormatted = newProjectCode.replace(/\//g, "-");
      
      console.log(`📝 Formatted codes: ${oldProjectCodeFormatted} → ${newProjectCodeFormatted}`);
      
      // The trainer assignment document ID pattern is:
      // {projectCode}-{year}-{branch}-{specialization}-{phaseBase}-phase-{phaseNumber}-{trainerId}-{date}
      // Example: RC-MBA-1st-OT-26-27-phase-1-GA-T015-2025-10-03
      
      // Query all trainer assignments with the old project code in sourceTrainingId
      const trainerAssignmentsQuery = query(
        collection(db, "trainerAssignments"), 
        where("sourceTrainingId", "==", oldProjectCode)
      );
      const assignmentsSnapshot = await getDocs(trainerAssignmentsQuery);
      
      if (!assignmentsSnapshot.empty) {
        console.log(`📋 Found ${assignmentsSnapshot.size} trainer assignments to update`);
        
        // Update each assignment with the new project code and new document ID
        for (const assignmentDoc of assignmentsSnapshot.docs) {
          const oldDocId = assignmentDoc.id;
          const assignmentData = assignmentDoc.data();
          
          console.log(`🔍 Processing document: ${oldDocId}`);
          
          // The document ID structure: {projectCode}-{year}-{branch}-{specialization}-{phaseBase}-phase-{phaseNumber}-{trainerId}-{date}
          // We need to replace the {projectCode} part at the beginning
          // Parse the document ID to extract parts
          const docParts = oldDocId.split('-');
          if (docParts.length >= 8) {
            // Replace the first part (project code) with the new project code
            // For RC-MBA-1st-OT-26-27-phase-1-GA-T015-2025-10-03:
            // docParts[0] = 'RC' (old project code)
            // Replace 'RC' with new project code parts
            
            const oldPCParts = oldProjectCodeFormatted.split('-');
            const newPCParts = newProjectCodeFormatted.split('-');
            
            // Replace the project code parts at the beginning
            const newDocParts = [...docParts];
            for (let i = 0; i < oldPCParts.length && i < newPCParts.length; i++) {
              newDocParts[i] = newPCParts[i];
            }
            
            const newDocId = newDocParts.join('-');
            
            console.log(`🆔 Document ID change: ${oldDocId} → ${newDocId}`);
            
            // Updated data with new sourceTrainingId
            const updatedData = {
              ...assignmentData,
              sourceTrainingId: newProjectCode,
              updatedAt: new Date()
            };
            
            // Create new document with new ID
            const newDocRef = doc(db, "trainerAssignments", newDocId);
            await setDoc(newDocRef, updatedData);
            console.log(`✅ Created new trainer assignment: ${newDocId}`);
            
            // Delete old document
            await deleteDoc(assignmentDoc.ref);
            console.log(`🗑️ Deleted old trainer assignment: ${oldDocId}`);
          } else {
            console.log(`⚠️ Unexpected document ID format: ${oldDocId}`);
          }
        }
        
        console.log(`✅ All trainer assignments migrated to new project code: ${newProjectCode}`);
      } else {
        console.log(`ℹ️ No trainer assignments found for project code: ${oldProjectCode}`);
        
        // Also try querying with formatted project code in case it's stored differently
        const alternativeQuery = query(
          collection(db, "trainerAssignments"), 
          where("sourceTrainingId", "==", oldProjectCodeFormatted)
        );
        const alternativeSnapshot = await getDocs(alternativeQuery);
        
        if (!alternativeSnapshot.empty) {
          console.log(`📋 Found ${alternativeSnapshot.size} trainer assignments with formatted project code`);
          
          for (const assignmentDoc of alternativeSnapshot.docs) {
            const oldDocId = assignmentDoc.id;
            const assignmentData = assignmentDoc.data();
            
            console.log(`🔍 Processing document: ${oldDocId}`);
            
            const docParts = oldDocId.split('-');
            if (docParts.length >= 8) {
              const oldPCParts = oldProjectCodeFormatted.split('-');
              const newPCParts = newProjectCodeFormatted.split('-');
              
              const newDocParts = [...docParts];
              for (let i = 0; i < oldPCParts.length && i < newPCParts.length; i++) {
                newDocParts[i] = newPCParts[i];
              }
              
              const newDocId = newDocParts.join('-');
              
              console.log(`🆔 Document ID change: ${oldDocId} → ${newDocId}`);
              
              const updatedData = {
                ...assignmentData,
                sourceTrainingId: newProjectCode,
                updatedAt: new Date()
              };
              
              const newDocRef = doc(db, "trainerAssignments", newDocId);
              await setDoc(newDocRef, updatedData);
              console.log(`✅ Created new trainer assignment: ${newDocId}`);
              
              await deleteDoc(assignmentDoc.ref);
              console.log(`🗑️ Deleted old trainer assignment: ${oldDocId}`);
            } else {
              console.log(`⚠️ Unexpected document ID format: ${oldDocId}`);
            }
          }
        } else {
          console.log(`ℹ️ No trainer assignments found with either format for: ${oldProjectCode} or ${oldProjectCodeFormatted}`);
        }
      }
    } catch (error) {
      console.error("Error updating trainer assignments:", error);
      // Don't throw error, just log it so main operation can continue
    }
  };

  // Function to recursively duplicate all subcollections from old document to new document
  const duplicateSubcollections = async (oldDocRef, newDocRef) => {
    try {
      // Known subcollections in trainingForms documents (add more as needed)
      const knownSubcollections = ['trainings', 'assignments', 'evaluations', 'reports', 'students', 'modules', 'sessions', 'domains', 'phases'];
      
      for (const subcollectionName of knownSubcollections) {
        try {
          // Get all documents from the subcollection in old document
          const oldSubcollectionRef = collection(oldDocRef, subcollectionName);
          const subcollectionSnapshot = await getDocs(oldSubcollectionRef);
          
          if (!subcollectionSnapshot.empty) {
            console.log(`🔄 Starting subcollection: ${subcollectionName} (${subcollectionSnapshot.size} documents)`);
            
            // Process each document in the subcollection sequentially to ensure proper copying
            for (const subDoc of subcollectionSnapshot.docs) {
              console.log(`  📄 Copying document: ${subcollectionName}/${subDoc.id}`);
              
              // Create the corresponding document in the new location
              const newSubDocRef = doc(newDocRef, subcollectionName, subDoc.id);
              
              // Copy the document data first
              await setDoc(newSubDocRef, subDoc.data());
              console.log(`  ✅ Document data copied: ${subcollectionName}/${subDoc.id}`);
              
              // 🔄 RECURSIVELY copy any nested subcollections within this document
              const oldNestedDocRef = doc(oldDocRef, subcollectionName, subDoc.id);
              await duplicateSubcollections(oldNestedDocRef, newSubDocRef);
              console.log(`  🔄 Nested subcollections processed for: ${subcollectionName}/${subDoc.id}`);
            }
            
            console.log(`✅ Completed subcollection: ${subcollectionName}`);
          }
        } catch (error) {
          console.log(`⚠️ Subcollection '${subcollectionName}' not found or error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Error duplicating subcollections:", error);
      // Don't throw error, just log it so main operation can continue
    }
  };

  const goToNextSection = () => {
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
    }
  };

  const goToPrevSection = () => {
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1]);
    }
  };

  // Validation function to check if form can be submitted
  const canSubmit = () => {
    // College code is required
    if (!formData.collegeCode || formData.collegeCode.trim() === '') {
      return false;
    }
    // Topics validation (existing)
    if (activeSection === "topics" && topicErrors.some(e => !!e)) {
      return false;
    }
    return true;
  };

// Update handleChange to auto-update projectCode when collegeCode changes
const handleChange = (e) => {
  const { name, value } = e.target;
  let updatedFormData = { ...formData, [name]: value };

  // Special handling for college code - only alphabets and auto-uppercase
  if (name === "collegeCode") {
    // Remove non-alphabetic characters and convert to uppercase
    const cleanValue = value.replace(/[^A-Za-z]/g, '').toUpperCase();
    updatedFormData.collegeCode = cleanValue;
    
    // Extract the existing project code parts
    const currentProjectCode = formData.projectCode || lead.projectCode || "";
    const parts = currentProjectCode.split("/");
    
    // If we have a valid project code structure, update only the college code part
    if (parts.length >= 4) {
      // Structure: COLLEGE_CODE/COURSE/YEAR/TYPE/YEAR_RANGE
      parts[0] = cleanValue; // Update college code (already uppercase)
      updatedFormData.projectCode = parts.join("/");
    } else {
      // If no valid structure exists, create a basic one with college code
      updatedFormData.projectCode = `${cleanValue}/${formData.course || "MBA"}/${formData.year || "1st"}/${formData.deliveryType || "OT"}/${formData.passingYear || "26-27"}`;
    }
  }

  setFormData(updatedFormData);
};  if (!lead) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Submission
              </h3>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit these changes? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Edit Lead Details</h2>
              <p className="text-blue-100 text-sm mt-1">
                {lead.projectCode} • Last updated:{" "}
                {new Date(
                  lead.updatedAt?.toDate() || new Date()
                ).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors p-1 rounded-full"
              disabled={loading}
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex mt-6 space-x-1">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeSection === section
                    ? "bg-white text-blue-800"
                    : "text-blue-200 hover:text-white hover:bg-blue-700"
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          <div className="p-6 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <FiInfo className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}
            {/* Basic Information Section */}
            {activeSection === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="collegeName"
                        value={formData.collegeName || formData.businessName}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="College Name"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Code
                    </label>
                    <input
                      type="text"
                      name="projectCode"
                      value={formData.projectCode}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                      readOnly
                      disabled
                      title="Project code cannot be modified"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Project code is system-generated and cannot be edited
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College Code *
                    </label>
                    <input
                      type="text"
                      name="collegeCode"
                      value={formData.collegeCode}
                      onChange={handleChange}
                      className={`block w-full px-3 py-2 border rounded-lg shadow-sm uppercase ${
                        formData.collegeCode && formData.collegeCode.trim() !== ''
                          ? "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                          : "border-red-300 focus:ring-red-500 focus:border-red-500"
                      }`}
                      placeholder="RC"
                      pattern="[A-Za-z]*"
                      maxLength="10"
                      title="Only alphabets allowed, automatically converted to uppercase"
                      required
                    />
                    {(!formData.collegeCode || formData.collegeCode.trim() === '') && (
                      <p className="text-xs text-red-600 mt-1">
                        College Code is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123 College Street"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMapPin className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Maharashtra"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="400001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="contractStartDate"
                        value={formData.contractStartDate}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract End Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="contractEndDate"
                        value={formData.contractEndDate}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Financial Section */}
            {activeSection === "financial" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Students (readonly) */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Total Students
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatIndianNumber(formData.studentCount, 0)}
                        className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-lg shadow-sm bg-blue-100"
                        readOnly
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* Cost Per Student (editable) */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Cost Per Student (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={numValue(formData.perStudentCost)}
                        onChange={(e) => {
                          const perStudentCost =
                            parseFloat(e.target.value) || 0;
                          const totalStudents = formData.studentCount || 0;
                          const baseAmount = perStudentCost * totalStudents;
                          const gstAmount = formData.gstType === "include" ? baseAmount * 0.18 : 0;
                          const netPayableAmount = baseAmount + gstAmount;

                          setFormData((prev) => ({
                            ...prev,
                            perStudentCost,
                            totalCost: baseAmount,
                            gstAmount,
                            netPayableAmount,
                            paymentDetails: prev.paymentDetails.map(
                              (payment) => ({
                                ...payment,
                                baseAmount: (parseFloat(payment.percentage) / 100) * baseAmount,
                                gstAmount: formData.gstType === "include" ? (parseFloat(payment.percentage) / 100) * gstAmount : 0,
                                totalAmount: (parseFloat(payment.percentage) / 100) * netPayableAmount,
                              })
                            ),
                          }));
                        }}
                        className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="h-5 w-5 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* --- GST Type Selection (UI & Logic) --- */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      GST Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gstType"
                          value="include"
                          checked={formData.gstType === "include"}
                          onChange={() => {
                            // If switching to include, add GST
                            const baseAmount = formData.totalCost || 0;
                            const gstAmount = baseAmount * 0.18;
                            const netPayableAmount = baseAmount + gstAmount;
                            const updatedPaymentDetails = formData.paymentDetails.map(payment => ({
                              ...payment,
                              baseAmount: (parseFloat(payment.percentage) / 100) * baseAmount,
                              gstAmount: (parseFloat(payment.percentage) / 100) * gstAmount,
                              totalAmount: (parseFloat(payment.percentage) / 100) * netPayableAmount
                            }));
                            setFormData(prev => ({
                              ...prev,
                              gstType: "include",
                              gstAmount,
                              netPayableAmount,
                              paymentDetails: updatedPaymentDetails
                            }));
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">Include GST (18%)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gstType"
                          value="exclude"
                          checked={formData.gstType === "exclude"}
                          onChange={() => {
                            // If switching to exclude, remove GST
                            const baseAmount = formData.totalCost || 0;
                            const gstAmount = 0;
                            const netPayableAmount = baseAmount;
                            const updatedPaymentDetails = formData.paymentDetails.map(payment => ({
                              ...payment,
                              baseAmount: (parseFloat(payment.percentage) / 100) * baseAmount,
                              gstAmount: 0,
                              totalAmount: (parseFloat(payment.percentage) / 100) * netPayableAmount
                            }));
                            setFormData(prev => ({
                              ...prev,
                              gstType: "exclude",
                              gstAmount,
                              netPayableAmount,
                              paymentDetails: updatedPaymentDetails
                            }));
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">No GST</span>
                      </label>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Current: {formData.gstType === "include"
                        ? "GST Included"
                        : formData.gstType === "exclude"
                        ? "No GST"
                        : "Not selected"}
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    <div className="flex items-center gap-4">
                      {/* Base Amount and GST Amount Group */}
                      <div className="border border-gray-300 rounded-lg p-4 flex-1">
                        <div className="flex items-center gap-2">
                          {/* Base Amount (excl. GST) */}
                          <div className="bg-orange-50 p-4 rounded-lg flex-1">
                            <label className="block text-sm font-medium text-orange-700 mb-1">
                              Base Amount (excl. GST)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={
                                  formatIndianNumber(formData.totalCost, 2)
                                }
                                readOnly
                                className="block w-full pl-10 pr-3 py-2 border border-orange-300 rounded-lg shadow-sm bg-orange-100"
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiDollarSign className="h-5 w-5 text-orange-400" />
                              </div>
                            </div>
                            <p className="text-xs text-orange-600 mt-1">
                              Stored in totalCost
                            </p>
                          </div>

                          {/* Plus Icon */}
                          <div className="flex items-center justify-center px-1">
                            <FiPlus className="h-4 w-4 text-gray-500" />
                          </div>

                          {/* GST Amount (18%) */}
                          <div className="bg-red-50 p-4 rounded-lg flex-1">
                            <label className="block text-sm font-medium text-red-700 mb-1">
                              GST Amount (18%)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={
                                  formatIndianNumber(formData.gstAmount, 2)
                                }
                                readOnly
                                className="block w-full pl-10 pr-3 py-2 border border-red-300 rounded-lg shadow-sm bg-red-100"
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiDollarSign className="h-5 w-5 text-red-400" />
                              </div>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              Stored in gstAmount
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Equals Icon */}
                      <div className="flex items-center justify-center px-1">
                        <span className="text-2xl font-bold text-gray-500">=</span>
                      </div>

                      {/* Total Amount (auto-calculated) */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Total Amount (
                          {formData.gstType === "include"
                            ? "incl. GST"
                            : "excl. GST"}
                          )
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={
                              formatIndianNumber(formData.netPayableAmount, 2)
                            }
                            readOnly
                            className="block w-full pl-10 pr-3 py-2 border border-green-300 rounded-lg shadow-sm bg-green-100"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiDollarSign className="h-5 w-5 text-green-400" />
                          </div>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Stored in netPayableAmount
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Type Selection */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-yellow-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    value={formData.paymentType || ""}
                    onChange={(e) => {
                      const newPaymentType = e.target.value;
                      const totalCost = formData.totalCost || 0;
                      
                      // Define payment fields for each type
                      const paymentFields = {
                        AT: ["Advance", "Training"],
                        ATP: ["Advance", "Training", "Placement"],
                        ATTP: ["Advance", "Training", "Training", "Placement"],
                        ATTT: ["Advance", "Training", "Training", "Training"],
                        EMI: []
                      };

                      const fields = paymentFields[newPaymentType] || [];
                      let newPaymentDetails = [];

                      if (newPaymentType === "EMI") {
                        // For EMI, ask for number of installments
                        const emiCount = prompt("Enter number of EMI installments:", "3");
                        const emiMonths = parseInt(emiCount) || 3;
                        
                        const totalAmount = parseFloat(formData.netPayableAmount) || 0;
                        const baseTotal = parseFloat(formData.totalCost) || 0;
                        const gstTotal = parseFloat(formData.gstAmount) || 0;
                        
                        const baseInstallment = baseTotal / emiMonths;
                        const gstInstallment = gstTotal / emiMonths;
                        const totalInstallment = totalAmount / emiMonths;
                        
                        newPaymentDetails = Array.from({length: emiMonths}, (_, i) => {
                          let percentage = 100 / emiMonths;
                          let baseAmt = baseInstallment;
                          let gstAmt = gstInstallment;
                          let totalAmt = totalInstallment;
                          
                          if (i === emiMonths - 1) {
                            percentage = 100 - (100 / emiMonths) * (emiMonths - 1);
                            baseAmt = baseTotal - baseInstallment * (emiMonths - 1);
                            gstAmt = gstTotal - gstInstallment * (emiMonths - 1);
                            totalAmt = totalAmount - totalInstallment * (emiMonths - 1);
                          }
                          
                          return {
                            name: `Installment ${i + 1}`,
                            percentage: percentage.toFixed(2),
                            baseAmount: baseAmt.toFixed(2),
                            gstAmount: gstAmt.toFixed(2),
                            totalAmount: totalAmt.toFixed(2)
                          };
                        });
                      } else {
                        // For other payment types, create equal splits
                        const basePercentage = Math.floor((100 / fields.length) * 100) / 100;
                        newPaymentDetails = fields.map((fieldName, i) => {
                          const isLast = i === fields.length - 1;
                          const percentage = isLast 
                            ? (100 - basePercentage * (fields.length - 1)).toFixed(2)
                            : basePercentage.toFixed(2);
                          
                          const baseAmount = totalCost * (parseFloat(percentage) / 100);
                          const gstAmount = formData.gstType === "include" ? baseAmount * 0.18 : 0;
                          const totalAmount = baseAmount + gstAmount;

                          return {
                            name: fieldName,
                            percentage: percentage,
                            baseAmount: baseAmount.toFixed(2),
                            gstAmount: gstAmount.toFixed(2),
                            totalAmount: totalAmount.toFixed(2)
                          };
                        });
                      }

                      setFormData(prev => ({
                        ...prev,
                        paymentType: newPaymentType,
                        paymentDetails: newPaymentDetails
                      }));
                    }}
                    className="block w-full px-3 py-2 border border-yellow-300 rounded-lg shadow-sm focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                  >
                    <option value="">Select Payment Type</option>
                    <option value="AT">AT - Advanced Training</option>
                    <option value="ATP">ATP - Advanced Training Placement</option>
                    <option value="ATTP">ATTP - Advanced Training Technical Placement</option>
                    <option value="ATTT">ATTT - Advanced Technical Training & Placement</option>
                    <option value="EMI">EMI - Easy Monthly Installments</option>
                  </select>
                  <p className="text-xs text-yellow-600 mt-1">
                    Current: {formData.paymentType ? `${formData.paymentType} (${formData.paymentDetails?.length || 0} payments)` : "Not selected"}
                  </p>
                </div>

                {/* --- Payment Breakdown --- */}
                {formData.paymentDetails?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Payment Breakdown
                    </h3>

                    {formData.paymentDetails.map((payment, index) => {
                      const totalAmount = parseFloat(payment.totalAmount) || 0;
                      const baseAmount = parseFloat(payment.baseAmount) || 0;
                      const gstAmount = parseFloat(payment.gstAmount) || 0;

                      return (
                        <div
                          key={index}
                          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Payment Name (editable) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Name
                              </label>
                              <input
                                type="text"
                                value={payment.name}
                                disabled
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                                placeholder="e.g., Advance, Installment"
                              />
                            </div>

                            {/* Percentage (editable) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Percentage (%)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={numValue(payment.percentage)}
                                  onChange={(e) => {
                                    let newPercentage = parseInt(e.target.value) || 0;
                                    const details = [...formData.paymentDetails];
                                    const errors = [...paymentErrors];

                                    // Error if 0 (manual input)
                                    if (newPercentage <= 0) {
                                      errors[index] = "Percentage must be greater than 0";
                                    } else {
                                      errors[index] = "";
                                    }

                                    // Adjust others so total is always 100
                                    if (details.length === 1) {
                                      details[0].percentage = 100;
                                      errors[0] = ""; // Clear error if auto-adjusted
                                    } else {
                                      if (index === details.length - 1) {
                                        // If last field edited, adjust first
                                        details[index].percentage = newPercentage;
                                        let sumOthers = details
                                          .slice(1, details.length - 1)
                                          .reduce((sum, p) => sum + (p.percentage || 0), 0);
                                        details[0].percentage = 100 - sumOthers - newPercentage;
                                        // Clear error if auto-adjusted to >0
                                        if (details[0].percentage <= 0) {
                                          details[0].percentage = 1;
                                          details[index].percentage = 99 - sumOthers;
                                        }
                                        errors[0] = details[0].percentage > 0 ? "" : "Percentage must be greater than 0";
                                      } else {
                                        // If not last, adjust last field
                                        details[index].percentage = newPercentage;
                                        let sumOthers = details
                                          .slice(0, details.length - 1)
                                          .reduce(
                                            (sum, p, i) =>
                                              i === index ? sum + newPercentage : sum + (p.percentage || 0),
                                            0
                                          );
                                        details[details.length - 1].percentage = 100 - sumOthers;
                                        // Clear error if auto-adjusted to >0
                                        if (details[details.length - 1].percentage <= 0) {
                                          details[details.length - 1].percentage = 1;
                                          details[index].percentage =
                                            99 -
                                            details
                                              .slice(0, details.length - 1)
                                              .reduce(
                                                (sum, p, i) =>
                                                  i === index ? sum : sum + (p.percentage || 0),
                                                0
                                              );
                                        }
                                        errors[details.length - 1] =
                                          details[details.length - 1].percentage > 0
                                            ? ""
                                            : "Percentage must be greater than 0";
                                      }
                                    }

                                    // Recalculate amounts
                                    const baseCost =
                                      formData.perStudentCost *
                                      (formData.studentCount || 0);
                                    const gstAmount = formData.gstType === "include" ? baseCost * 0.18 : 0;
                                    const netPayableAmount = baseCost + gstAmount;

                                    details.forEach((payment) => {
                                      const baseAmount = baseCost * ((payment.percentage || 0) / 100);
                                      const paymentGstAmount = formData.gstType === "include" ? gstAmount * ((payment.percentage || 0) / 100) : 0;
                                      const totalAmount = baseAmount + paymentGstAmount;

                                      payment.totalAmount = totalAmount;
                                      payment.baseAmount = baseAmount;
                                      payment.gstAmount = paymentGstAmount;
                                    });

                                    setFormData((prev) => ({
                                      ...prev,
                                      paymentDetails: details,
                                      totalCost: baseCost,
                                      gstAmount,
                                      netPayableAmount,
                                    }));
                                    setPaymentErrors(errors);
                                  }}
                                  min="1"
                                  max="100"
                                  step="1"
                                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiPercent className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                              {paymentErrors[index] && (
                                <p className="text-red-600 text-xs mt-1">{paymentErrors[index]}</p>
                              )}
                            </div>

                            {/* Amount Display */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (
                                {formData.gstType === "include"
                                  ? "incl. GST"
                                  : "excl. GST"}
                                )
                              </label>
                              <input
                                type="text"
                                value={`₹${formatIndianNumber(totalAmount, 2)}`}
                                readOnly
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {formData.gstType === "include"
                                  ? `(Base: ₹${formatIndianNumber(baseAmount, 2)} + GST: ₹${formatIndianNumber(gstAmount, 2)})`
                                  : "No GST applied"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Percentage Summary */}
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Percentage:</span>
                        <span
                          className={`font-bold ${
                            Math.abs(formData.paymentDetails.reduce(
                              (sum, payment) => sum + (parseFloat(payment.percentage) || 0),
                              0
                            ) - 100) > 0.01
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {formData.paymentDetails.reduce(
                            (sum, payment) => sum + (parseFloat(payment.percentage) || 0),
                            0
                          ).toFixed(2)}%
                        </span>
                      </div>
                      {error && (
                        <div className="mt-2 text-red-600 text-sm">{error}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Course Information Section */}
            {activeSection === "course" && (
              <div className="space-y-6">
                {/* First row with course, year, delivery type, and passing year */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Course
                    </label>
                    <div className="relative">
                      {formData.isCustomCourse ? (
                        <input
                          type="text"
                          name="course"
                          value={formData.course || ""}
                          onChange={handleChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter custom course"
                        />
                      ) : (
                        <select
                          name="course"
                          value={formData.course || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "Others") {
                              setFormData(prev => ({
                                ...prev,
                                course: "",
                                isCustomCourse: true,
                                courses: [{ specialization: "", students: 0, othersSpecText: "" }]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                course: value,
                                isCustomCourse: false,
                                courses: [{ specialization: "", students: 0, othersSpecText: "" }]
                              }));
                            }
                          }}
                          className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Course</option>
                          {Object.keys(courseSpecializations).map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </select>
                      )}
                      {!formData.isCustomCourse && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <FiChevronDown className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {formData.isCustomCourse && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            isCustomCourse: false,
                            course: "",
                            courses: prev.courses.map(course => ({
                              ...course,
                              specialization: "",
                              othersSpecText: ""
                            }))
                          }));
                        }}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Switch to predefined courses
                      </button>
                    )}
                  </div>

                  {/* Year dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <div className="relative">
                      <select
                        name="year"
                        value={formData.year || ""}
                        onChange={handleChange}
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Year</option>
                        <option value="1st">1st</option>
                        <option value="2nd">2nd</option>
                        <option value="3rd">3rd</option>
                        <option value="4th">4th</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <FiChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Type dropdown and custom input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Type
                    </label>
                    <input
                      type="text"
                      value={
                        formData.deliveryType
                          ? formData.deliveryType
                          : ""
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                      readOnly
                      disabled
                    />
                  </div>

                  {/* Passing Year dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Year
                    </label>
                    <input
                      type="text"
                      value={formData.passingYear || ""}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Specialization and student count fields */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Course Specializations
                  </h3>
                  {formData.courses?.map((course, index) => {
                    const isOthersSpec = course.specialization === "Other";
                    const currentSpecializations = formData.isCustomCourse
                      ? ["Other"]
                      : (courseSpecializations[formData.course] || []);

                    return (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Specialization
                            </label>
                            {formData.isCustomCourse ? (
                              <input
                                type="text"
                                value={course.specialization ?? ""}
                                onChange={e =>
                                  handleCourseChange(index, "specialization", e.target.value)
                                }
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Enter specialization"
                              />
                            ) : (
                              <div className="relative">
                                <select
                                  value={course.specialization ?? ""}
                                  onChange={e => {
                                    const value = e.target.value;
                                    if (value === "Other") {
                                      handleCourseChange(index, "specialization", "Other");
                                    } else {
                                      handleCourseChange(index, "specialization", value);
                                    }
                                  }}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                >
                                  <option value="">Select Specialization</option>
                                  {currentSpecializations.map(spec => (
                                    <option key={spec} value={spec}>
                                      {spec}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  <FiChevronDown className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Show custom input for "Other" specialization */}
                          {isOthersSpec && !formData.isCustomCourse && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Custom Specialization
                              </label>
                              <input
                                type="text"
                                value={course.othersSpecText ?? ""}
                                onChange={e =>
                                  handleCourseChange(index, "othersSpecText", e.target.value)
                                }
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Enter custom specialization"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              No. of Students
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={numValue(course.students)}
                                onChange={(e) =>
                                  handleCourseChange(
                                    index,
                                    "students",
                                    e.target.value
                                  )
                                }
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUser className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {index === formData.courses.length - 1 && (
                              <button
                                type="button"
                                onClick={addCourse}
                                className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors"
                                title="Add specialization"
                              >
                                <FiPlus className="h-5 w-5" />
                              </button>
                            )}
                            {formData.courses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCourse(index)}
                                className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors"
                                title="Remove specialization"
                              >
                                <FiTrash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total students count */}
                  <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Total Students
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatIndianNumber(formData.studentCount, 0)}
                        className="block w-full pl-10 pr-3 py-2 border border-blue-300 rounded-lg shadow-sm bg-blue-100 focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Contacts Section */}
            {activeSection === "contacts" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TPO Column */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    TPO Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="tpoName"
                        value={formData.tpoName}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="tpoEmail"
                        value={formData.tpoEmail}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="tpo@college.edu"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="tpoPhone"
                        value={formData.tpoPhone}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9876543210"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Column */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Training Coordinator
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="trainingName"
                        value={formData.trainingName}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Jane Smith"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="trainingEmail"
                        value={formData.trainingEmail}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="coordinator@training.com"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="trainingPhone"
                        value={formData.trainingPhone}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9876543210"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Column */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Account Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Account Holder Name"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="accountEmail"
                        value={formData.accountEmail}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="account@college.edu"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="accountPhone"
                        value={formData.accountPhone}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9876543210"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Topics Section */}
            {activeSection === "topics" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Training Topics
                  </h3>
                  <button
                    type="button"
                    onClick={addTopic}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Topic
                  </button>
                </div>

                {formData.topics?.map((topic, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Topic
                        </label>
                        <div className="relative">
                          <select
                            value={topic.topic}
                            onChange={(e) =>
                              handleTopicChange(index, "topic", e.target.value)
                            }
                            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                          >
                            <option value="">Select Topic</option>
                            {topicOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <FiChevronDown className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          value={numValue(topic.hours)}
                          onChange={(e) =>
                            handleTopicChange(index, "hours", e.target.value)
                          }
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          min="0"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeTopic(index)}
                          className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition-colors"
                          title="Remove topic"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {topicErrors[index] && (
                      <p className="text-red-600 text-xs mt-1">{topicErrors[index]}</p>
                    )}
                  </div>
                ))}

                {/* Total Training Hours */}
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Total Training Hours
                  </label>
                  <input
                    type="number"
                    name="totalHours"
                    value={numValue(formData.totalHours)}
                    className="block w-full px-3 py-2 border border-blue-300 rounded-lg shadow-sm bg-blue-100 focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>
          {/* Footer - Modify the submit button to show confirmation */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {loading
                ? "Saving changes..."
                : `Section ${sections.indexOf(activeSection) + 1} of ${
                    sections.length
                  }`}
            </div>
            <div className="flex space-x-3">
              {activeSection !== sections[0] && (
                <button
                  type="button"
                  onClick={goToPrevSection}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  disabled={loading}
                >
                  <FiArrowLeft className="mr-2" /> Back
                </button>
              )}

              {activeSection !== sections[sections.length - 1] && (
                <button
                  type="button"
                  onClick={goToNextSection}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  disabled={
                    loading ||
                    (activeSection === "topics" && topicErrors.some(e => !!e))
                  }
                >
                  Next <FiArrowRight className="ml-2" />
                </button>
              )}

              {/* Submit button available on all sections */}
              <button
                type="button"
                onClick={() => setShowConfirmation(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 flex items-center ${
                  canSubmit() && !loading
                    ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
                disabled={loading || !canSubmit()}
                title={!canSubmit() ? "Please fill in the required College Code field" : "Submit changes"}
              >
                Submit Changes
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5 ml-2 -mr-1 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4.93 4.93a10 10 0 0114.14 14.14M2.05 12a9.95 9.95 0 001.88 5.66M12 22c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10 10z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClosedLeadModal;
